(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
let config = {
  "January" : [2],
  "May" : [29],
  "July" : [4],
  "September" : [4],
  "November" : [23,24],
  "December" : [25]
};

module.exports = config;
},{}],2:[function(require,module,exports){
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


},{"./config/holidayConfig.js":1,"./main_modules/Days.js":3,"./main_modules/DisplayIntervals.js":4,"./main_modules/Header.js":5,"./main_modules/Month.js":6,"./main_modules/logIn.js":8}],3:[function(require,module,exports){
let utils = require('./Utils.js');
let config = require('../config/holidayConfig.js');

class Days {
    constructor(month, year, source_data) {
        this.source_data = source_data;

        this.jq = $('div.main div.panel div.columns div.days');

        this.month = month;
        this.year = year;
        this.days = [];
        this.days_names = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        this.total_days = '';
        this.days_selected = [];

        this.init_days();
        this.change_days();
        this.clear();

    }

    init_days() {
        this.total_days = moment(this.year + ' ' + this.month, "YYYY MMMM").daysInMonth();

        for (let day_nr = 1; day_nr <= this.total_days; day_nr++) {
            let day = this.create_month_day(day_nr);
            this.jq.find('div.calendar').append(day.jq);
            this.days.push(day);
        }
        let first_day = this.days[0].day_of_week;

        for (let i = 0; i < 6 - first_day; i++) {
            let fill_day_preppend = this.create_month_day(0, 1);
            this.jq.find('div.calendar').prepend(fill_day_preppend.jq);
            this.days.unshift(fill_day_preppend);
        }

        for (let i = 6; i >= 0; i--) {
            this.jq.find('div.calendar').prepend(`<p class="days_name">${this.days_names[i]}</p>`);
        }
    }

    create_month_day(day_nr, fill) {
        let day = {
            nr : '',
            day_of_week : '',
            jq : $('<p></p>'),
            type : ''
        };

        this.set_day(day, day_nr, fill);

        return day;
    }

    set_day(day, day_nr, fill) {
        day.jq.removeClass('fill');
        day.jq.removeClass('state_holiday');

        day.jq.removeClass('weekend');
        if (fill) {
            day.nr = day_nr;
            day.day_of_week = -1;
            //day.jq.text('');
            utils.change_char_nice(day.jq, '');
            day.type ='fill';
            day.jq.addClass('fill');
        } else {
            day.nr = day_nr;
            day.day_of_week =  moment(this.year + ' ' + this.month + ' ' + day_nr, "YYYY MMMM DD").day();
            //day.jq.text(day.nr);
            utils.change_char_nice(day.jq, day.nr);
            day.type = day.day_of_week == 0 || day.day_of_week == 6 ? 'weekend' : 'normal';

            day.type = config[this.month] && config[this.month].filter((x) => x == day.nr).length ? 'state_holiday' : day.type;
            if (day.type == 'weekend') day.jq.addClass('weekend');
            if (day.type == 'state_holiday') day.jq.addClass('state_holiday');
        }

    }

    change_days() {
        this.jq.on('month_changed', $.proxy(function(event, month) {
            this.clear_select();
            this.month = month;
            this.total_days = moment(this.year + ' ' + this.month, "YYYY MMMM").daysInMonth();

            let first_week_day = moment(this.year + ' ' + this.month + ' ' + 1, "YYYY MMMM DD").day();

            let total_for_lenght = this.total_days + (first_week_day == 0 ? 6 : first_week_day - 1);
            total_for_lenght = total_for_lenght > this.days.length ? total_for_lenght : this.days.length;
            let current_mmonth_day_nr = 1;

            let timmer = 0;
            for (let i = 0; i < total_for_lenght; i++) {
                setTimeout($.proxy(function(){
                    if (this.days[i]) {
                        if ((first_week_day == 0 && i < 6) || (first_week_day > i + 1)) {
                            this.set_day(this.days[i], 0, 1);
                        } else if (current_mmonth_day_nr <= this.total_days) {
                            this.set_day(this.days[i], current_mmonth_day_nr);
                            current_mmonth_day_nr++;
                        } else {
                            this.days[i].jq.remove();
                            this.days[i] = '';
                        }
                    } else {
                        let day = this.create_month_day(current_mmonth_day_nr);
                        this.jq.find('div.calendar').append(day.jq);
                        this.days.push(day);
                        current_mmonth_day_nr++;
                    }
                }, this), timmer);

                timmer += 50;
            }

            setTimeout($.proxy(function(){

                this.days = this.days.filter((x) => x);
                this.preselect();
            }, this), timmer + 500);

        }, this));
    }

    select_interval() {
        this.jq.find('div.calendar').on('click', 'p', $.proxy(function(event){
            let day = $(event.currentTarget);
            let totalDisplay = $('div.main div.panel div div.month div.total p');

            if (day.hasClass('day_selected')) {
                this.days_selected = this.days_selected.remove(day.text());
                change_char_nice(totalDisplay, Number(totalDisplay.text()) -1);

                day.removeClass('day_selected');
            } else if (day.hasClass('')) {
                this.days_selected.push(Number(day.text()));
                utils.change_char_nice(totalDisplay, Number(totalDisplay.text()) + 1);

                day.addClass('day_selected');
            }
        }, this));

        this.preselect();
    }

    preselect() {
        if(this.source_data.months[this.month]) {
            for (let day_selected of this.source_data.months[this.month]) {
                for (let current_day of this.days) {
                    if (current_day.nr == day_selected) {
                        current_day.jq.trigger('click');
                        break;
                    }
                }
            }
        }
    }

    clear() {
        $('div.main div.panel div.actions div.clear_selection').on('click', $.proxy(function(event) {
            console.log('fired');
            this.clear_select();
            delete this.source_data.months[this.month];
            $('div.main div.panel div.display table').trigger('renderIntervals');
        }, this));
    }

    clear_select() {
        for (let day of this.days) {
            day.jq.removeClass('day_selected');
        }
        this.days_selected = [];
        utils.change_char_nice($('div.main div.panel div div.month div.total p'), 0);
    }

    save_interval(display) {

        this.jq.parent().find('div.actions div.save_interval').on('click', $.proxy(function(event) {
            if (this.days_selected.length) {
                this.source_data.months[this.month] = this.days_selected;
                display.table.trigger('renderIntervals');
            }
            console.log(this.source_data);
        }, this));
    }

}

module.exports = Days;

},{"../config/holidayConfig.js":1,"./Utils.js":7}],4:[function(require,module,exports){
let utils = require('./Utils.js');

class DisplayIntervals {
    constructor(user, year, source_data) {
        this.source_data = source_data;

        this.jq = $('div.main div.panel div.display');
        this.jq.removeClass('hide');

        this.table = this.jq.find('table');
        this.user = user;
        this.year = year;
        //this.save_data = {};

        this.toggle_panel();
        this.render_intervals();
        this.set_panel_month();
        this.save_intervals();

    }

    toggle_panel() {
        this.jq.find('p.title span').on('click', $.proxy(function(event) {
            $('div.main div.panel div.columns').toggleClass('hide');
            this.jq.find('p.savePTO').toggleClass('hide');
        }, this));
    }

    render_intervals() {
        this.table.on('renderIntervals', $.proxy(function(event){
            console.log(this.source_data.months);

            this.table.addClass('hide_for_render');
            setTimeout($.proxy(function(){

                this.table.find('tbody').html('');
                for (let month in this.source_data.months) {
                    let row = $('<tr></tr>');
                    row.append(`<td>${month}</td>`);
                    row.append(`<td>${this.source_data.months[month].join(',')}</td>`);
                    row.append(`<td>${this.source_data.months[month].length }</td>`);

                    this.table.find('tbody').append(row);
                }

                console.log(Object.keys(this.source_data.months));
                utils.change_char_nice(this.jq.find('div.totalYear p.total'), Object.keys(this.source_data.months).reduce(
                    (sum, x) => sum + this.source_data.months[x].length
                    , 0));

                this.table.removeClass('hide_for_render');
            }, this), 600);

        }, this));
        this.table.trigger('renderIntervals');
    }

    set_panel_month() {
        this.table.on('click','tr', function(){
            console.log(this);
            let month = $(this).find('td').first().text();
            console.log(month);
            $('div.month_input p.month_text').trigger('month_changed', month);


        });
    }

    save_intervals() {
        this.jq.find('p.savePTO').on('click', $.proxy(function(event) {
            console.log(this.source_data);
            $.post( "/update", this.source_data, function( data ) {
                console.log(data.response);
            });
        }, this));
    }

}

module.exports = DisplayIntervals;
},{"./Utils.js":7}],5:[function(require,module,exports){
let utils = require('./Utils.js');

class Header {
    constructor() {
        this.jq = $('div.header');
        this.title = this.jq.find('span').text();
    }

    set_user(user_name) {
        this.jq.find('div.user').css('opacity', '1');
        utils.random_text_change(this.jq.find('p').first(), user_name, 100);

    }

    set_year(year) {

        if (/ - \d{4}/.test(this.title)){
            console.log(year);
            this.title = this.title.replace(/\d{4}/, year);
        } else {
            this.title = this.title + ' - ' + year;
        }

        utils.random_text_change(this.jq.find('span').first(), this.title, 100);
    }
}

module.exports = Header;
},{"./Utils.js":7}],6:[function(require,module,exports){
let utils = require('./Utils.js');

class Month {
    constructor() {
        this.jq = $('div.main div.panel div.columns div.month');
        this.month = this.jq.find('p.month_text').text();
        this.months_in_year = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    }

    set_month(month) {
        this.month = month;
        utils.random_text_change(this.jq.find('p.month_text').first(),month, 100);
    }

    change_month_up_down() {
        this.jq.find('p.up,p.down').on('click', $.proxy(function (event) {
            for (let i = 0; i < this.months_in_year.length; i++) {
                if (this.month == this.months_in_year[i]) {
                    let next_month = (this.months_in_year[i + 1] || this.months_in_year[0]);
                    let previous_month = (this.months_in_year[i - 1] || this.months_in_year.last());
                    if ($(event.currentTarget).hasClass('up')) {
                        this.set_month(next_month);
                    } else {
                        this.set_month(previous_month);
                    }
                    this.jq.find('p.month_text').trigger('month_changed', this.month);
                    break;
                }
            }

        }, this));
    }

    change_month(days) {
        this.jq.find('p.month_text').on('month_changed', $.proxy(function (event, month) {
            this.set_month(month);
            days.jq.trigger('month_changed', this.month);
        },this));
    }
}

module.exports = Month;
},{"./Utils.js":7}],7:[function(require,module,exports){
module.exports.random_text_change =  function (jq_obj, text_new, timmer) {

    let [,width] = /(\d+)/.exec(jq_obj.css('font-size'));

    let random_change_style = $('<style type="text/css"></style>');
    random_change_style.text(
        '.random_change { display:inline-block; min-width: 0px; transition: all ' + timmer / 1000 + 's;} ' +
        '.random_change_span_hide { min-width: ' + width/2 + 'px; opacity:0; } ' +
        '.random_change_span_remove { min-width: ' + width/2 + 'px; opacity:0; }'
    );
    $('head').prepend(random_change_style);

    let chars_new = text_new.split('');
    let chars_org = jq_obj.text().split('');
    let max_nr = chars_new.length > chars_org.length ? chars_new.length : chars_org.length;

    jq_obj.text('');
    for (let i = 0; i < max_nr; i++) {
        if (chars_org[i]) {
            chars_org[i] = $(`<span class='random_change'>${chars_org[i]}</span>`);
            chars_org[i];
            if (chars_org[i].text() == ' ') {
                chars_org[i].css('min-width', width/3-1 + 'px');
            }

        } else {
            chars_org[i] = $(`<span class='random_change'></span>`);
        }

        jq_obj.append(chars_org[i]);
    }

    let counter = [...Array(max_nr).keys()];

    counter.shuffle = function() {
        var i = this.length, j, temp;
        if ( i == 0 ) return this;
        while ( --i ) {
            j = Math.floor( Math.random() * ( i + 1 ) );
            temp = this[i];
            this[i] = this[j];
            this[j] = temp;
        }

        return this;
    }

    counter = counter.shuffle();
    let initial_time = timmer;
    for (let index of counter) {
        if (typeof chars_org[index] != 'undefined' && typeof chars_new[index] != 'undefined') {

            setTimeout(function() {
                chars_org[index].addClass('random_change_span_hide');
                setTimeout(function() {
                    if (chars_new[index] == ' ') {
                        chars_org[index].css('width', '8px');
                    }
                    chars_org[index].text(chars_new[index]);
                    chars_org[index].removeClass('random_change_span_hide');
                },initial_time)

            }, timmer);

        } else if (typeof chars_new[index] == 'undefined') {
            setTimeout(function() {
                chars_org[index].addClass('random_change_span_remove');
                setTimeout(function(){
                    chars_org[index].remove();
                }, initial_time);
            }, timmer);
        }

        timmer += initial_time;
    }

    setTimeout(function() {
        jq_obj.html(jq_obj.text());
        random_change_style.remove();

    }, initial_time + timmer);

}

module.exports.change_char_nice = function(jq_obj, new_text) {
    jq_obj.removeClass('single_char_change');
    jq_obj.addClass('single_char_change');
    setTimeout(function(){
        jq_obj.text(new_text);
    }, 250);

    setTimeout(function () {
        jq_obj.removeClass('single_char_change');
    }, 600);
}

},{}],8:[function(require,module,exports){
let utils = require('./Utils.js');

class LogIn {
    constructor(source_data) {
        this.source_data = source_data;
        this.jq = $('div.log_in');
        this.message = 'Log in with email';
        this.user = '';
    }

    set_messaje(messaje) {
        this.message = messaje;
        utils.random_text_change(this.jq.find('p').first(), messaje, 100);
    }

    send_input_text(header) {
        return this.jq.find('input').on('keypress', $.proxy( function(event) {
            if (event.key == 'Enter' && !this.user) {
                this.user = $(event.currentTarget).val();

                header.set_user(this.user);
                this.source_data.user = this.user;
                header.jq.find('div.user').removeClass('hide');

                this.set_messaje('Please choose year');
                this.jq.find('input').val('');
            } else if (event.key == 'Enter') {
                this.year = $(event.currentTarget).val();
                if (/^\d{4}$/.test(this.year)) {
                    header.set_year(this.year);
                    this.jq.hide();
                }
                this.source_data.year = this.year;

                $(document).trigger('user_year_set');

                $.get( "/check_data", {user : this.user, year: this.year}, $.proxy(function( data ) {
                    console.log(this.source_data);
                    this.source_data.months = data.response;

                    $('div.display table').trigger('renderIntervals');
                    $('div.display table tbody tr').first().trigger('click');
                }, this));
            }
        }, this));
    }
}

module.exports = LogIn;
},{"./Utils.js":7}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkQ6XFxwcm9ncmFtbWluZ1xcbm9kZWpzXFx2Y19hcHBcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkQ6L3Byb2dyYW1taW5nL25vZGVqcy92Y19hcHAvcHVibGljL2phdmFzY3JpcHRzL2NvbmZpZy9ob2xpZGF5Q29uZmlnLmpzIiwiRDovcHJvZ3JhbW1pbmcvbm9kZWpzL3ZjX2FwcC9wdWJsaWMvamF2YXNjcmlwdHMvZmFrZV81OTJlODA1NS5qcyIsIkQ6L3Byb2dyYW1taW5nL25vZGVqcy92Y19hcHAvcHVibGljL2phdmFzY3JpcHRzL21haW5fbW9kdWxlcy9EYXlzLmpzIiwiRDovcHJvZ3JhbW1pbmcvbm9kZWpzL3ZjX2FwcC9wdWJsaWMvamF2YXNjcmlwdHMvbWFpbl9tb2R1bGVzL0Rpc3BsYXlJbnRlcnZhbHMuanMiLCJEOi9wcm9ncmFtbWluZy9ub2RlanMvdmNfYXBwL3B1YmxpYy9qYXZhc2NyaXB0cy9tYWluX21vZHVsZXMvSGVhZGVyLmpzIiwiRDovcHJvZ3JhbW1pbmcvbm9kZWpzL3ZjX2FwcC9wdWJsaWMvamF2YXNjcmlwdHMvbWFpbl9tb2R1bGVzL01vbnRoLmpzIiwiRDovcHJvZ3JhbW1pbmcvbm9kZWpzL3ZjX2FwcC9wdWJsaWMvamF2YXNjcmlwdHMvbWFpbl9tb2R1bGVzL1V0aWxzLmpzIiwiRDovcHJvZ3JhbW1pbmcvbm9kZWpzL3ZjX2FwcC9wdWJsaWMvamF2YXNjcmlwdHMvbWFpbl9tb2R1bGVzL2xvZ0luLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImxldCBjb25maWcgPSB7XHJcbiAgXCJKYW51YXJ5XCIgOiBbMl0sXHJcbiAgXCJNYXlcIiA6IFsyOV0sXHJcbiAgXCJKdWx5XCIgOiBbNF0sXHJcbiAgXCJTZXB0ZW1iZXJcIiA6IFs0XSxcclxuICBcIk5vdmVtYmVyXCIgOiBbMjMsMjRdLFxyXG4gIFwiRGVjZW1iZXJcIiA6IFsyNV1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gY29uZmlnOyIsIi8qKlxyXG4gKiAgQ3JlYXRlZCBieSBzdGVmIG9uIDEyLzI5LzIwMTYuXHJcbiAqL1xyXG5sZXQgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcvaG9saWRheUNvbmZpZy5qcycpO1xyXG5sZXQgTG9nSW4gPSByZXF1aXJlKCcuL21haW5fbW9kdWxlcy9sb2dJbi5qcycpO1xyXG5sZXQgSGVhZGVyID0gcmVxdWlyZSgnLi9tYWluX21vZHVsZXMvSGVhZGVyLmpzJyk7XHJcbmxldCBNb250aCA9IHJlcXVpcmUoJy4vbWFpbl9tb2R1bGVzL01vbnRoLmpzJyk7XHJcbmxldCBEYXlzID0gcmVxdWlyZSgnLi9tYWluX21vZHVsZXMvRGF5cy5qcycpO1xyXG5sZXQgRGlzcGxheUludGVydmFscyA9IHJlcXVpcmUoJy4vbWFpbl9tb2R1bGVzL0Rpc3BsYXlJbnRlcnZhbHMuanMnKTtcclxuXHJcblxyXG5sZXQgc291cmNlX2RhdGEgPSB7XHJcbiAgICB1c2VyIDogJycsXHJcbiAgICB5ZWFyOiAnJyxcclxuICAgIG1vbnRoczoge31cclxufTtcclxuXHJcbmlmICghQXJyYXkucHJvdG90eXBlLmxhc3Qpe1xyXG4gICAgQXJyYXkucHJvdG90eXBlLmxhc3QgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzW3RoaXMubGVuZ3RoIC0gMV07XHJcbiAgICB9O1xyXG59XHJcblxyXG5pZiAoIUFycmF5LnByb3RvdHlwZS5yZW1vdmUpe1xyXG4gICAgQXJyYXkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKHJlbW92ZWRfZWxlbWVudCl7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAobGV0IGVsZW1lbnQgb2YgdGhpcykge1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudCAhPSByZW1vdmVkX2VsZW1lbnQpIHJlc3VsdC5wdXNoKGVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfTtcclxufVxyXG5cclxuLy8gLS0tLS0tLS0tLSBtYWluIC0tLS0tLS0tLS0tXHJcblxyXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcclxuICAgIGxldCBoZWFkZXIgPSBuZXcgSGVhZGVyKCk7XHJcblxyXG4gICAgbGV0IGxvZ0luID0gbmV3IExvZ0luKHNvdXJjZV9kYXRhKTtcclxuICAgIGxvZ0luLnNlbmRfaW5wdXRfdGV4dChoZWFkZXIpO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9uKCd1c2VyX3llYXJfc2V0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coc291cmNlX2RhdGEpO1xyXG4gICAgICAgIGxldCBwYW5lbCA9IG5ldyBQYW5lbChzb3VyY2VfZGF0YS55ZWFyKTtcclxuICAgICAgICBwYW5lbC5kYXlzLnNlbGVjdF9pbnRlcnZhbCgpO1xyXG4gICAgXHJcbiAgICAgICAgbGV0IGRpc3BsYXlJbnRlcnZhbHMgPSBuZXcgRGlzcGxheUludGVydmFscyhzb3VyY2VfZGF0YS51c2VyLCBzb3VyY2VfZGF0YS55ZWFyLCBzb3VyY2VfZGF0YSk7XHJcbiAgICAgICAgcGFuZWwuZGF5cy5zYXZlX2ludGVydmFsKGRpc3BsYXlJbnRlcnZhbHMpO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuLy8gLS0tLS0tLS0tLSBtYWluIC0tLS0tLS0tLS0tXHJcblxyXG5jbGFzcyBQYW5lbCB7XHJcbiAgICBjb25zdHJ1Y3Rvcih5ZWFyKSB7XHJcbiAgICAgICAgdGhpcy55ZWFyID0geWVhcjtcclxuICAgICAgICB0aGlzLmpxID0gJCgnZGl2Lm1haW4gZGl2LnBhbmVsJyk7XHJcbiAgICAgICAgdGhpcy5qcS5yZW1vdmVDbGFzcygnaGlkZScpO1xyXG4gICAgICAgIHRoaXMubW9udGggPSBuZXcgTW9udGgoKTtcclxuICAgICAgICB0aGlzLmRheXMgPSBuZXcgRGF5cyh0aGlzLm1vbnRoLm1vbnRoLCB5ZWFyLCBzb3VyY2VfZGF0YSk7XHJcbiAgICAgICAgdGhpcy5tb250aC5jaGFuZ2VfbW9udGgodGhpcy5kYXlzKTtcclxuICAgICAgICB0aGlzLm1vbnRoLmNoYW5nZV9tb250aF91cF9kb3duKCk7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcbn1cclxuXHJcbiIsImxldCB1dGlscyA9IHJlcXVpcmUoJy4vVXRpbHMuanMnKTtcclxubGV0IGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZy9ob2xpZGF5Q29uZmlnLmpzJyk7XHJcblxyXG5jbGFzcyBEYXlzIHtcclxuICAgIGNvbnN0cnVjdG9yKG1vbnRoLCB5ZWFyLCBzb3VyY2VfZGF0YSkge1xyXG4gICAgICAgIHRoaXMuc291cmNlX2RhdGEgPSBzb3VyY2VfZGF0YTtcclxuXHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuY29sdW1ucyBkaXYuZGF5cycpO1xyXG5cclxuICAgICAgICB0aGlzLm1vbnRoID0gbW9udGg7XHJcbiAgICAgICAgdGhpcy55ZWFyID0geWVhcjtcclxuICAgICAgICB0aGlzLmRheXMgPSBbXTtcclxuICAgICAgICB0aGlzLmRheXNfbmFtZXMgPSBbJ00nLCAnVCcsICdXJywgJ1QnLCAnRicsICdTJywgJ1MnXTtcclxuICAgICAgICB0aGlzLnRvdGFsX2RheXMgPSAnJztcclxuICAgICAgICB0aGlzLmRheXNfc2VsZWN0ZWQgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0X2RheXMoKTtcclxuICAgICAgICB0aGlzLmNoYW5nZV9kYXlzKCk7XHJcbiAgICAgICAgdGhpcy5jbGVhcigpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBpbml0X2RheXMoKSB7XHJcbiAgICAgICAgdGhpcy50b3RhbF9kYXlzID0gbW9tZW50KHRoaXMueWVhciArICcgJyArIHRoaXMubW9udGgsIFwiWVlZWSBNTU1NXCIpLmRheXNJbk1vbnRoKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGRheV9uciA9IDE7IGRheV9uciA8PSB0aGlzLnRvdGFsX2RheXM7IGRheV9ucisrKSB7XHJcbiAgICAgICAgICAgIGxldCBkYXkgPSB0aGlzLmNyZWF0ZV9tb250aF9kYXkoZGF5X25yKTtcclxuICAgICAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYuY2FsZW5kYXInKS5hcHBlbmQoZGF5LmpxKTtcclxuICAgICAgICAgICAgdGhpcy5kYXlzLnB1c2goZGF5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGZpcnN0X2RheSA9IHRoaXMuZGF5c1swXS5kYXlfb2Zfd2VlaztcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA2IC0gZmlyc3RfZGF5OyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGZpbGxfZGF5X3ByZXBwZW5kID0gdGhpcy5jcmVhdGVfbW9udGhfZGF5KDAsIDEpO1xyXG4gICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5jYWxlbmRhcicpLnByZXBlbmQoZmlsbF9kYXlfcHJlcHBlbmQuanEpO1xyXG4gICAgICAgICAgICB0aGlzLmRheXMudW5zaGlmdChmaWxsX2RheV9wcmVwcGVuZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gNjsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYuY2FsZW5kYXInKS5wcmVwZW5kKGA8cCBjbGFzcz1cImRheXNfbmFtZVwiPiR7dGhpcy5kYXlzX25hbWVzW2ldfTwvcD5gKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlX21vbnRoX2RheShkYXlfbnIsIGZpbGwpIHtcclxuICAgICAgICBsZXQgZGF5ID0ge1xyXG4gICAgICAgICAgICBuciA6ICcnLFxyXG4gICAgICAgICAgICBkYXlfb2Zfd2VlayA6ICcnLFxyXG4gICAgICAgICAgICBqcSA6ICQoJzxwPjwvcD4nKSxcclxuICAgICAgICAgICAgdHlwZSA6ICcnXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRfZGF5KGRheSwgZGF5X25yLCBmaWxsKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGRheTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRfZGF5KGRheSwgZGF5X25yLCBmaWxsKSB7XHJcbiAgICAgICAgZGF5LmpxLnJlbW92ZUNsYXNzKCdmaWxsJyk7XHJcbiAgICAgICAgZGF5LmpxLnJlbW92ZUNsYXNzKCdzdGF0ZV9ob2xpZGF5Jyk7XHJcblxyXG4gICAgICAgIGRheS5qcS5yZW1vdmVDbGFzcygnd2Vla2VuZCcpO1xyXG4gICAgICAgIGlmIChmaWxsKSB7XHJcbiAgICAgICAgICAgIGRheS5uciA9IGRheV9ucjtcclxuICAgICAgICAgICAgZGF5LmRheV9vZl93ZWVrID0gLTE7XHJcbiAgICAgICAgICAgIC8vZGF5LmpxLnRleHQoJycpO1xyXG4gICAgICAgICAgICB1dGlscy5jaGFuZ2VfY2hhcl9uaWNlKGRheS5qcSwgJycpO1xyXG4gICAgICAgICAgICBkYXkudHlwZSA9J2ZpbGwnO1xyXG4gICAgICAgICAgICBkYXkuanEuYWRkQ2xhc3MoJ2ZpbGwnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkYXkubnIgPSBkYXlfbnI7XHJcbiAgICAgICAgICAgIGRheS5kYXlfb2Zfd2VlayA9ICBtb21lbnQodGhpcy55ZWFyICsgJyAnICsgdGhpcy5tb250aCArICcgJyArIGRheV9uciwgXCJZWVlZIE1NTU0gRERcIikuZGF5KCk7XHJcbiAgICAgICAgICAgIC8vZGF5LmpxLnRleHQoZGF5Lm5yKTtcclxuICAgICAgICAgICAgdXRpbHMuY2hhbmdlX2NoYXJfbmljZShkYXkuanEsIGRheS5ucik7XHJcbiAgICAgICAgICAgIGRheS50eXBlID0gZGF5LmRheV9vZl93ZWVrID09IDAgfHwgZGF5LmRheV9vZl93ZWVrID09IDYgPyAnd2Vla2VuZCcgOiAnbm9ybWFsJztcclxuXHJcbiAgICAgICAgICAgIGRheS50eXBlID0gY29uZmlnW3RoaXMubW9udGhdICYmIGNvbmZpZ1t0aGlzLm1vbnRoXS5maWx0ZXIoKHgpID0+IHggPT0gZGF5Lm5yKS5sZW5ndGggPyAnc3RhdGVfaG9saWRheScgOiBkYXkudHlwZTtcclxuICAgICAgICAgICAgaWYgKGRheS50eXBlID09ICd3ZWVrZW5kJykgZGF5LmpxLmFkZENsYXNzKCd3ZWVrZW5kJyk7XHJcbiAgICAgICAgICAgIGlmIChkYXkudHlwZSA9PSAnc3RhdGVfaG9saWRheScpIGRheS5qcS5hZGRDbGFzcygnc3RhdGVfaG9saWRheScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgY2hhbmdlX2RheXMoKSB7XHJcbiAgICAgICAgdGhpcy5qcS5vbignbW9udGhfY2hhbmdlZCcsICQucHJveHkoZnVuY3Rpb24oZXZlbnQsIG1vbnRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xlYXJfc2VsZWN0KCk7XHJcbiAgICAgICAgICAgIHRoaXMubW9udGggPSBtb250aDtcclxuICAgICAgICAgICAgdGhpcy50b3RhbF9kYXlzID0gbW9tZW50KHRoaXMueWVhciArICcgJyArIHRoaXMubW9udGgsIFwiWVlZWSBNTU1NXCIpLmRheXNJbk1vbnRoKCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZmlyc3Rfd2Vla19kYXkgPSBtb21lbnQodGhpcy55ZWFyICsgJyAnICsgdGhpcy5tb250aCArICcgJyArIDEsIFwiWVlZWSBNTU1NIEREXCIpLmRheSgpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHRvdGFsX2Zvcl9sZW5naHQgPSB0aGlzLnRvdGFsX2RheXMgKyAoZmlyc3Rfd2Vla19kYXkgPT0gMCA/IDYgOiBmaXJzdF93ZWVrX2RheSAtIDEpO1xyXG4gICAgICAgICAgICB0b3RhbF9mb3JfbGVuZ2h0ID0gdG90YWxfZm9yX2xlbmdodCA+IHRoaXMuZGF5cy5sZW5ndGggPyB0b3RhbF9mb3JfbGVuZ2h0IDogdGhpcy5kYXlzLmxlbmd0aDtcclxuICAgICAgICAgICAgbGV0IGN1cnJlbnRfbW1vbnRoX2RheV9uciA9IDE7XHJcblxyXG4gICAgICAgICAgICBsZXQgdGltbWVyID0gMDtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbF9mb3JfbGVuZ2h0OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoJC5wcm94eShmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRheXNbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChmaXJzdF93ZWVrX2RheSA9PSAwICYmIGkgPCA2KSB8fCAoZmlyc3Rfd2Vla19kYXkgPiBpICsgMSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0X2RheSh0aGlzLmRheXNbaV0sIDAsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRfbW1vbnRoX2RheV9uciA8PSB0aGlzLnRvdGFsX2RheXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0X2RheSh0aGlzLmRheXNbaV0sIGN1cnJlbnRfbW1vbnRoX2RheV9ucik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50X21tb250aF9kYXlfbnIrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF5c1tpXS5qcS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF5c1tpXSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGRheSA9IHRoaXMuY3JlYXRlX21vbnRoX2RheShjdXJyZW50X21tb250aF9kYXlfbnIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5jYWxlbmRhcicpLmFwcGVuZChkYXkuanEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRheXMucHVzaChkYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50X21tb250aF9kYXlfbnIrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LCB0aGlzKSwgdGltbWVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aW1tZXIgKz0gNTA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoJC5wcm94eShmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuZGF5cyA9IHRoaXMuZGF5cy5maWx0ZXIoKHgpID0+IHgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcmVzZWxlY3QoKTtcclxuICAgICAgICAgICAgfSwgdGhpcyksIHRpbW1lciArIDUwMCk7XHJcblxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBzZWxlY3RfaW50ZXJ2YWwoKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYuY2FsZW5kYXInKS5vbignY2xpY2snLCAncCcsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgICBsZXQgZGF5ID0gJChldmVudC5jdXJyZW50VGFyZ2V0KTtcclxuICAgICAgICAgICAgbGV0IHRvdGFsRGlzcGxheSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYgZGl2Lm1vbnRoIGRpdi50b3RhbCBwJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGF5Lmhhc0NsYXNzKCdkYXlfc2VsZWN0ZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXlzX3NlbGVjdGVkID0gdGhpcy5kYXlzX3NlbGVjdGVkLnJlbW92ZShkYXkudGV4dCgpKTtcclxuICAgICAgICAgICAgICAgIGNoYW5nZV9jaGFyX25pY2UodG90YWxEaXNwbGF5LCBOdW1iZXIodG90YWxEaXNwbGF5LnRleHQoKSkgLTEpO1xyXG5cclxuICAgICAgICAgICAgICAgIGRheS5yZW1vdmVDbGFzcygnZGF5X3NlbGVjdGVkJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF5Lmhhc0NsYXNzKCcnKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXlzX3NlbGVjdGVkLnB1c2goTnVtYmVyKGRheS50ZXh0KCkpKTtcclxuICAgICAgICAgICAgICAgIHV0aWxzLmNoYW5nZV9jaGFyX25pY2UodG90YWxEaXNwbGF5LCBOdW1iZXIodG90YWxEaXNwbGF5LnRleHQoKSkgKyAxKTtcclxuXHJcbiAgICAgICAgICAgICAgICBkYXkuYWRkQ2xhc3MoJ2RheV9zZWxlY3RlZCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG5cclxuICAgICAgICB0aGlzLnByZXNlbGVjdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByZXNlbGVjdCgpIHtcclxuICAgICAgICBpZih0aGlzLnNvdXJjZV9kYXRhLm1vbnRoc1t0aGlzLm1vbnRoXSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBkYXlfc2VsZWN0ZWQgb2YgdGhpcy5zb3VyY2VfZGF0YS5tb250aHNbdGhpcy5tb250aF0pIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGN1cnJlbnRfZGF5IG9mIHRoaXMuZGF5cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X2RheS5uciA9PSBkYXlfc2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudF9kYXkuanEudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyKCkge1xyXG4gICAgICAgICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuYWN0aW9ucyBkaXYuY2xlYXJfc2VsZWN0aW9uJykub24oJ2NsaWNrJywgJC5wcm94eShmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZmlyZWQnKTtcclxuICAgICAgICAgICAgdGhpcy5jbGVhcl9zZWxlY3QoKTtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuc291cmNlX2RhdGEubW9udGhzW3RoaXMubW9udGhdO1xyXG4gICAgICAgICAgICAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2LmRpc3BsYXkgdGFibGUnKS50cmlnZ2VyKCdyZW5kZXJJbnRlcnZhbHMnKTtcclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXJfc2VsZWN0KCkge1xyXG4gICAgICAgIGZvciAobGV0IGRheSBvZiB0aGlzLmRheXMpIHtcclxuICAgICAgICAgICAgZGF5LmpxLnJlbW92ZUNsYXNzKCdkYXlfc2VsZWN0ZWQnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kYXlzX3NlbGVjdGVkID0gW107XHJcbiAgICAgICAgdXRpbHMuY2hhbmdlX2NoYXJfbmljZSgkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2IGRpdi5tb250aCBkaXYudG90YWwgcCcpLCAwKTtcclxuICAgIH1cclxuXHJcbiAgICBzYXZlX2ludGVydmFsKGRpc3BsYXkpIHtcclxuXHJcbiAgICAgICAgdGhpcy5qcS5wYXJlbnQoKS5maW5kKCdkaXYuYWN0aW9ucyBkaXYuc2F2ZV9pbnRlcnZhbCcpLm9uKCdjbGljaycsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGF5c19zZWxlY3RlZC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc291cmNlX2RhdGEubW9udGhzW3RoaXMubW9udGhdID0gdGhpcy5kYXlzX3NlbGVjdGVkO1xyXG4gICAgICAgICAgICAgICAgZGlzcGxheS50YWJsZS50cmlnZ2VyKCdyZW5kZXJJbnRlcnZhbHMnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnNvdXJjZV9kYXRhKTtcclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERheXM7XHJcbiIsImxldCB1dGlscyA9IHJlcXVpcmUoJy4vVXRpbHMuanMnKTtcclxuXHJcbmNsYXNzIERpc3BsYXlJbnRlcnZhbHMge1xyXG4gICAgY29uc3RydWN0b3IodXNlciwgeWVhciwgc291cmNlX2RhdGEpIHtcclxuICAgICAgICB0aGlzLnNvdXJjZV9kYXRhID0gc291cmNlX2RhdGE7XHJcblxyXG4gICAgICAgIHRoaXMuanEgPSAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2LmRpc3BsYXknKTtcclxuICAgICAgICB0aGlzLmpxLnJlbW92ZUNsYXNzKCdoaWRlJyk7XHJcblxyXG4gICAgICAgIHRoaXMudGFibGUgPSB0aGlzLmpxLmZpbmQoJ3RhYmxlJyk7XHJcbiAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcclxuICAgICAgICB0aGlzLnllYXIgPSB5ZWFyO1xyXG4gICAgICAgIC8vdGhpcy5zYXZlX2RhdGEgPSB7fTtcclxuXHJcbiAgICAgICAgdGhpcy50b2dnbGVfcGFuZWwoKTtcclxuICAgICAgICB0aGlzLnJlbmRlcl9pbnRlcnZhbHMoKTtcclxuICAgICAgICB0aGlzLnNldF9wYW5lbF9tb250aCgpO1xyXG4gICAgICAgIHRoaXMuc2F2ZV9pbnRlcnZhbHMoKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgdG9nZ2xlX3BhbmVsKCkge1xyXG4gICAgICAgIHRoaXMuanEuZmluZCgncC50aXRsZSBzcGFuJykub24oJ2NsaWNrJywgJC5wcm94eShmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2LmNvbHVtbnMnKS50b2dnbGVDbGFzcygnaGlkZScpO1xyXG4gICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ3Auc2F2ZVBUTycpLnRvZ2dsZUNsYXNzKCdoaWRlJyk7XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcl9pbnRlcnZhbHMoKSB7XHJcbiAgICAgICAgdGhpcy50YWJsZS5vbigncmVuZGVySW50ZXJ2YWxzJywgJC5wcm94eShmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuc291cmNlX2RhdGEubW9udGhzKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudGFibGUuYWRkQ2xhc3MoJ2hpZGVfZm9yX3JlbmRlcicpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCQucHJveHkoZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLmZpbmQoJ3Rib2R5JykuaHRtbCgnJyk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBtb250aCBpbiB0aGlzLnNvdXJjZV9kYXRhLm1vbnRocykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCByb3cgPSAkKCc8dHI+PC90cj4nKTtcclxuICAgICAgICAgICAgICAgICAgICByb3cuYXBwZW5kKGA8dGQ+JHttb250aH08L3RkPmApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJvdy5hcHBlbmQoYDx0ZD4ke3RoaXMuc291cmNlX2RhdGEubW9udGhzW21vbnRoXS5qb2luKCcsJyl9PC90ZD5gKTtcclxuICAgICAgICAgICAgICAgICAgICByb3cuYXBwZW5kKGA8dGQ+JHt0aGlzLnNvdXJjZV9kYXRhLm1vbnRoc1ttb250aF0ubGVuZ3RoIH08L3RkPmApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLmZpbmQoJ3Rib2R5JykuYXBwZW5kKHJvdyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coT2JqZWN0LmtleXModGhpcy5zb3VyY2VfZGF0YS5tb250aHMpKTtcclxuICAgICAgICAgICAgICAgIHV0aWxzLmNoYW5nZV9jaGFyX25pY2UodGhpcy5qcS5maW5kKCdkaXYudG90YWxZZWFyIHAudG90YWwnKSwgT2JqZWN0LmtleXModGhpcy5zb3VyY2VfZGF0YS5tb250aHMpLnJlZHVjZShcclxuICAgICAgICAgICAgICAgICAgICAoc3VtLCB4KSA9PiBzdW0gKyB0aGlzLnNvdXJjZV9kYXRhLm1vbnRoc1t4XS5sZW5ndGhcclxuICAgICAgICAgICAgICAgICAgICAsIDApKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLnJlbW92ZUNsYXNzKCdoaWRlX2Zvcl9yZW5kZXInKTtcclxuICAgICAgICAgICAgfSwgdGhpcyksIDYwMCk7XHJcblxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgICAgICB0aGlzLnRhYmxlLnRyaWdnZXIoJ3JlbmRlckludGVydmFscycpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldF9wYW5lbF9tb250aCgpIHtcclxuICAgICAgICB0aGlzLnRhYmxlLm9uKCdjbGljaycsJ3RyJywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcyk7XHJcbiAgICAgICAgICAgIGxldCBtb250aCA9ICQodGhpcykuZmluZCgndGQnKS5maXJzdCgpLnRleHQoKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cobW9udGgpO1xyXG4gICAgICAgICAgICAkKCdkaXYubW9udGhfaW5wdXQgcC5tb250aF90ZXh0JykudHJpZ2dlcignbW9udGhfY2hhbmdlZCcsIG1vbnRoKTtcclxuXHJcblxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmVfaW50ZXJ2YWxzKCkge1xyXG4gICAgICAgIHRoaXMuanEuZmluZCgncC5zYXZlUFRPJykub24oJ2NsaWNrJywgJC5wcm94eShmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnNvdXJjZV9kYXRhKTtcclxuICAgICAgICAgICAgJC5wb3N0KCBcIi91cGRhdGVcIiwgdGhpcy5zb3VyY2VfZGF0YSwgZnVuY3Rpb24oIGRhdGEgKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhLnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEaXNwbGF5SW50ZXJ2YWxzOyIsImxldCB1dGlscyA9IHJlcXVpcmUoJy4vVXRpbHMuanMnKTtcclxuXHJcbmNsYXNzIEhlYWRlciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmpxID0gJCgnZGl2LmhlYWRlcicpO1xyXG4gICAgICAgIHRoaXMudGl0bGUgPSB0aGlzLmpxLmZpbmQoJ3NwYW4nKS50ZXh0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0X3VzZXIodXNlcl9uYW1lKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYudXNlcicpLmNzcygnb3BhY2l0eScsICcxJyk7XHJcbiAgICAgICAgdXRpbHMucmFuZG9tX3RleHRfY2hhbmdlKHRoaXMuanEuZmluZCgncCcpLmZpcnN0KCksIHVzZXJfbmFtZSwgMTAwKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2V0X3llYXIoeWVhcikge1xyXG5cclxuICAgICAgICBpZiAoLyAtIFxcZHs0fS8udGVzdCh0aGlzLnRpdGxlKSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHllYXIpO1xyXG4gICAgICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy50aXRsZS5yZXBsYWNlKC9cXGR7NH0vLCB5ZWFyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy50aXRsZSArICcgLSAnICsgeWVhcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHV0aWxzLnJhbmRvbV90ZXh0X2NoYW5nZSh0aGlzLmpxLmZpbmQoJ3NwYW4nKS5maXJzdCgpLCB0aGlzLnRpdGxlLCAxMDApO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEhlYWRlcjsiLCJsZXQgdXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzLmpzJyk7XHJcblxyXG5jbGFzcyBNb250aCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmpxID0gJCgnZGl2Lm1haW4gZGl2LnBhbmVsIGRpdi5jb2x1bW5zIGRpdi5tb250aCcpO1xyXG4gICAgICAgIHRoaXMubW9udGggPSB0aGlzLmpxLmZpbmQoJ3AubW9udGhfdGV4dCcpLnRleHQoKTtcclxuICAgICAgICB0aGlzLm1vbnRoc19pbl95ZWFyID0gWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknLCAnQXVndXN0JywgJ1NlcHRlbWJlcicsICdPY3RvYmVyJywgJ05vdmVtYmVyJywgJ0RlY2VtYmVyJ107XHJcbiAgICB9XHJcblxyXG4gICAgc2V0X21vbnRoKG1vbnRoKSB7XHJcbiAgICAgICAgdGhpcy5tb250aCA9IG1vbnRoO1xyXG4gICAgICAgIHV0aWxzLnJhbmRvbV90ZXh0X2NoYW5nZSh0aGlzLmpxLmZpbmQoJ3AubW9udGhfdGV4dCcpLmZpcnN0KCksbW9udGgsIDEwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgY2hhbmdlX21vbnRoX3VwX2Rvd24oKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdwLnVwLHAuZG93bicpLm9uKCdjbGljaycsICQucHJveHkoZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5tb250aHNfaW5feWVhci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW9udGggPT0gdGhpcy5tb250aHNfaW5feWVhcltpXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXh0X21vbnRoID0gKHRoaXMubW9udGhzX2luX3llYXJbaSArIDFdIHx8IHRoaXMubW9udGhzX2luX3llYXJbMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwcmV2aW91c19tb250aCA9ICh0aGlzLm1vbnRoc19pbl95ZWFyW2kgLSAxXSB8fCB0aGlzLm1vbnRoc19pbl95ZWFyLmxhc3QoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQoZXZlbnQuY3VycmVudFRhcmdldCkuaGFzQ2xhc3MoJ3VwJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRfbW9udGgobmV4dF9tb250aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRfbW9udGgocHJldmlvdXNfbW9udGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ3AubW9udGhfdGV4dCcpLnRyaWdnZXIoJ21vbnRoX2NoYW5nZWQnLCB0aGlzLm1vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2hhbmdlX21vbnRoKGRheXMpIHtcclxuICAgICAgICB0aGlzLmpxLmZpbmQoJ3AubW9udGhfdGV4dCcpLm9uKCdtb250aF9jaGFuZ2VkJywgJC5wcm94eShmdW5jdGlvbiAoZXZlbnQsIG1vbnRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0X21vbnRoKG1vbnRoKTtcclxuICAgICAgICAgICAgZGF5cy5qcS50cmlnZ2VyKCdtb250aF9jaGFuZ2VkJywgdGhpcy5tb250aCk7XHJcbiAgICAgICAgfSx0aGlzKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9udGg7IiwibW9kdWxlLmV4cG9ydHMucmFuZG9tX3RleHRfY2hhbmdlID0gIGZ1bmN0aW9uIChqcV9vYmosIHRleHRfbmV3LCB0aW1tZXIpIHtcclxuXHJcbiAgICBsZXQgWyx3aWR0aF0gPSAvKFxcZCspLy5leGVjKGpxX29iai5jc3MoJ2ZvbnQtc2l6ZScpKTtcclxuXHJcbiAgICBsZXQgcmFuZG9tX2NoYW5nZV9zdHlsZSA9ICQoJzxzdHlsZSB0eXBlPVwidGV4dC9jc3NcIj48L3N0eWxlPicpO1xyXG4gICAgcmFuZG9tX2NoYW5nZV9zdHlsZS50ZXh0KFxyXG4gICAgICAgICcucmFuZG9tX2NoYW5nZSB7IGRpc3BsYXk6aW5saW5lLWJsb2NrOyBtaW4td2lkdGg6IDBweDsgdHJhbnNpdGlvbjogYWxsICcgKyB0aW1tZXIgLyAxMDAwICsgJ3M7fSAnICtcclxuICAgICAgICAnLnJhbmRvbV9jaGFuZ2Vfc3Bhbl9oaWRlIHsgbWluLXdpZHRoOiAnICsgd2lkdGgvMiArICdweDsgb3BhY2l0eTowOyB9ICcgK1xyXG4gICAgICAgICcucmFuZG9tX2NoYW5nZV9zcGFuX3JlbW92ZSB7IG1pbi13aWR0aDogJyArIHdpZHRoLzIgKyAncHg7IG9wYWNpdHk6MDsgfSdcclxuICAgICk7XHJcbiAgICAkKCdoZWFkJykucHJlcGVuZChyYW5kb21fY2hhbmdlX3N0eWxlKTtcclxuXHJcbiAgICBsZXQgY2hhcnNfbmV3ID0gdGV4dF9uZXcuc3BsaXQoJycpO1xyXG4gICAgbGV0IGNoYXJzX29yZyA9IGpxX29iai50ZXh0KCkuc3BsaXQoJycpO1xyXG4gICAgbGV0IG1heF9uciA9IGNoYXJzX25ldy5sZW5ndGggPiBjaGFyc19vcmcubGVuZ3RoID8gY2hhcnNfbmV3Lmxlbmd0aCA6IGNoYXJzX29yZy5sZW5ndGg7XHJcblxyXG4gICAganFfb2JqLnRleHQoJycpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXhfbnI7IGkrKykge1xyXG4gICAgICAgIGlmIChjaGFyc19vcmdbaV0pIHtcclxuICAgICAgICAgICAgY2hhcnNfb3JnW2ldID0gJChgPHNwYW4gY2xhc3M9J3JhbmRvbV9jaGFuZ2UnPiR7Y2hhcnNfb3JnW2ldfTwvc3Bhbj5gKTtcclxuICAgICAgICAgICAgY2hhcnNfb3JnW2ldO1xyXG4gICAgICAgICAgICBpZiAoY2hhcnNfb3JnW2ldLnRleHQoKSA9PSAnICcpIHtcclxuICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpXS5jc3MoJ21pbi13aWR0aCcsIHdpZHRoLzMtMSArICdweCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNoYXJzX29yZ1tpXSA9ICQoYDxzcGFuIGNsYXNzPSdyYW5kb21fY2hhbmdlJz48L3NwYW4+YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBqcV9vYmouYXBwZW5kKGNoYXJzX29yZ1tpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNvdW50ZXIgPSBbLi4uQXJyYXkobWF4X25yKS5rZXlzKCldO1xyXG5cclxuICAgIGNvdW50ZXIuc2h1ZmZsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpID0gdGhpcy5sZW5ndGgsIGosIHRlbXA7XHJcbiAgICAgICAgaWYgKCBpID09IDAgKSByZXR1cm4gdGhpcztcclxuICAgICAgICB3aGlsZSAoIC0taSApIHtcclxuICAgICAgICAgICAgaiA9IE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiAoIGkgKyAxICkgKTtcclxuICAgICAgICAgICAgdGVtcCA9IHRoaXNbaV07XHJcbiAgICAgICAgICAgIHRoaXNbaV0gPSB0aGlzW2pdO1xyXG4gICAgICAgICAgICB0aGlzW2pdID0gdGVtcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGNvdW50ZXIgPSBjb3VudGVyLnNodWZmbGUoKTtcclxuICAgIGxldCBpbml0aWFsX3RpbWUgPSB0aW1tZXI7XHJcbiAgICBmb3IgKGxldCBpbmRleCBvZiBjb3VudGVyKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjaGFyc19vcmdbaW5kZXhdICE9ICd1bmRlZmluZWQnICYmIHR5cGVvZiBjaGFyc19uZXdbaW5kZXhdICE9ICd1bmRlZmluZWQnKSB7XHJcblxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhcnNfb3JnW2luZGV4XS5hZGRDbGFzcygncmFuZG9tX2NoYW5nZV9zcGFuX2hpZGUnKTtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYXJzX25ld1tpbmRleF0gPT0gJyAnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0uY3NzKCd3aWR0aCcsICc4cHgnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhcnNfb3JnW2luZGV4XS50ZXh0KGNoYXJzX25ld1tpbmRleF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0ucmVtb3ZlQ2xhc3MoJ3JhbmRvbV9jaGFuZ2Vfc3Bhbl9oaWRlJyk7XHJcbiAgICAgICAgICAgICAgICB9LGluaXRpYWxfdGltZSlcclxuXHJcbiAgICAgICAgICAgIH0sIHRpbW1lcik7XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNoYXJzX25ld1tpbmRleF0gPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0uYWRkQ2xhc3MoJ3JhbmRvbV9jaGFuZ2Vfc3Bhbl9yZW1vdmUnKTtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICBjaGFyc19vcmdbaW5kZXhdLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSwgaW5pdGlhbF90aW1lKTtcclxuICAgICAgICAgICAgfSwgdGltbWVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRpbW1lciArPSBpbml0aWFsX3RpbWU7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICBqcV9vYmouaHRtbChqcV9vYmoudGV4dCgpKTtcclxuICAgICAgICByYW5kb21fY2hhbmdlX3N0eWxlLnJlbW92ZSgpO1xyXG5cclxuICAgIH0sIGluaXRpYWxfdGltZSArIHRpbW1lcik7XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5jaGFuZ2VfY2hhcl9uaWNlID0gZnVuY3Rpb24oanFfb2JqLCBuZXdfdGV4dCkge1xyXG4gICAganFfb2JqLnJlbW92ZUNsYXNzKCdzaW5nbGVfY2hhcl9jaGFuZ2UnKTtcclxuICAgIGpxX29iai5hZGRDbGFzcygnc2luZ2xlX2NoYXJfY2hhbmdlJyk7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAganFfb2JqLnRleHQobmV3X3RleHQpO1xyXG4gICAgfSwgMjUwKTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBqcV9vYmoucmVtb3ZlQ2xhc3MoJ3NpbmdsZV9jaGFyX2NoYW5nZScpO1xyXG4gICAgfSwgNjAwKTtcclxufVxyXG4iLCJsZXQgdXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzLmpzJyk7XHJcblxyXG5jbGFzcyBMb2dJbiB7XHJcbiAgICBjb25zdHJ1Y3Rvcihzb3VyY2VfZGF0YSkge1xyXG4gICAgICAgIHRoaXMuc291cmNlX2RhdGEgPSBzb3VyY2VfZGF0YTtcclxuICAgICAgICB0aGlzLmpxID0gJCgnZGl2LmxvZ19pbicpO1xyXG4gICAgICAgIHRoaXMubWVzc2FnZSA9ICdMb2cgaW4gd2l0aCBlbWFpbCc7XHJcbiAgICAgICAgdGhpcy51c2VyID0gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0X21lc3NhamUobWVzc2FqZSkge1xyXG4gICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhamU7XHJcbiAgICAgICAgdXRpbHMucmFuZG9tX3RleHRfY2hhbmdlKHRoaXMuanEuZmluZCgncCcpLmZpcnN0KCksIG1lc3NhamUsIDEwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2VuZF9pbnB1dF90ZXh0KGhlYWRlcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmpxLmZpbmQoJ2lucHV0Jykub24oJ2tleXByZXNzJywgJC5wcm94eSggZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LmtleSA9PSAnRW50ZXInICYmICF0aGlzLnVzZXIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlciA9ICQoZXZlbnQuY3VycmVudFRhcmdldCkudmFsKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaGVhZGVyLnNldF91c2VyKHRoaXMudXNlcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZV9kYXRhLnVzZXIgPSB0aGlzLnVzZXI7XHJcbiAgICAgICAgICAgICAgICBoZWFkZXIuanEuZmluZCgnZGl2LnVzZXInKS5yZW1vdmVDbGFzcygnaGlkZScpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0X21lc3NhamUoJ1BsZWFzZSBjaG9vc2UgeWVhcicpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5qcS5maW5kKCdpbnB1dCcpLnZhbCgnJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQua2V5ID09ICdFbnRlcicpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMueWVhciA9ICQoZXZlbnQuY3VycmVudFRhcmdldCkudmFsKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoL15cXGR7NH0kLy50ZXN0KHRoaXMueWVhcikpIHtcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXIuc2V0X3llYXIodGhpcy55ZWFyKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmpxLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuc291cmNlX2RhdGEueWVhciA9IHRoaXMueWVhcjtcclxuXHJcbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCd1c2VyX3llYXJfc2V0Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgJC5nZXQoIFwiL2NoZWNrX2RhdGFcIiwge3VzZXIgOiB0aGlzLnVzZXIsIHllYXI6IHRoaXMueWVhcn0sICQucHJveHkoZnVuY3Rpb24oIGRhdGEgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5zb3VyY2VfZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zb3VyY2VfZGF0YS5tb250aHMgPSBkYXRhLnJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAkKCdkaXYuZGlzcGxheSB0YWJsZScpLnRyaWdnZXIoJ3JlbmRlckludGVydmFscycpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJ2Rpdi5kaXNwbGF5IHRhYmxlIHRib2R5IHRyJykuZmlyc3QoKS50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgICAgICAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExvZ0luOyJdfQ==
