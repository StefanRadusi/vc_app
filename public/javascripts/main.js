/**
 *  Created by stef on 12/29/2016.
 */
let config = require('./config/holidayConfig.js');
let LogIn = require('./main_modules/logIn.js');
let Header = require('./main_modules/Header.js');
let Month = require('./main_modules/Month.js');
let Days = require('./main_modules/Days.js');
let DisplayIntervals = require('./main_modules/DisplayIntervals.js');


let source_data = {
    user : '',
    year: '',
    months: {}
};

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
}

if (!Array.prototype.remove){
    Array.prototype.remove = function(removed_element){
        let result = [];
        for (let element of this) {
            if (element != removed_element) result.push(element);
        }
        return result;
    };
}

// ---------- main -----------

$(document).ready(function() {
    let header = new Header();

    let logIn = new LogIn(source_data);
    logIn.send_input_text(header);

    $(document).on('user_year_set', function() {
        console.log(source_data);
        let panel = new Panel(source_data.year);
        panel.days.select_interval();
    
        let displayIntervals = new DisplayIntervals(source_data.user, source_data.year, source_data);
        panel.days.save_interval(displayIntervals);
    });
});

// ---------- main -----------

class Panel {
    constructor(year) {
        this.year = year;
        this.jq = $('div.main div.panel');
        this.jq.removeClass('hide');
        this.month = new Month();
        this.days = new Days(this.month.month, year, source_data);
        this.month.change_month(this.days);
        this.month.change_month_up_down();
        
    }
}

