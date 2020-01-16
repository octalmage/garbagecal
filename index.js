#!/usr/bin/env node
const ical = require('node-ical');
const applescript = require('applescript');
const openurl = require('openurl');
const cron = require('node-cron');
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const args = process.argv.slice(2);

if (!args[0]) {
  console.error('Please provide the public URL to an ical file as the only argument.');
  process.exit(1);
}

const script = `
activate application "Finder"
tell application "System Events"
    set visible of processes where name is not "Finder" to false
end tell
tell application "Finder" to set collapsed of windows to true
`;

const regex = /(https:\/\/zoom\.us\/j\/\d{9})/m;

const pollCalendar = () => {
  console.log('Checking calendar...');
  ical.fromURL(args[0], {}, function (err, data) {
    const currentDateObj = new Date();
    const newDateObj = new Date(currentDateObj.getTime() + 1.5 * 60000);
    for (let k in data) {
      if (data.hasOwnProperty(k)) {
        const ev = data[k];
        if (data[k].type == 'VEVENT') {
          if (ev.start > currentDateObj && ev.start < newDateObj) {
            console.log(`${ev.summary} is in ${ev.location} on the ${ev.start.getDate()} of ${months[ev.start.getMonth()]} at ${ev.start.toLocaleTimeString('en-GB')}`);
            applescript.execString(script, () => {
              const match = regex.exec(ev.description);
              if (match.length > 1) {
                openurl.open(match[1]);
              }
            });
          }
        }
      }
    }
  });
};

pollCalendar();

cron.schedule('* * * * *', () => {
  pollCalendar();
});


