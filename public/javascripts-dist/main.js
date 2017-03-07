(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
let config = {
  sua : {
    "January" : [2],
    "May" : [29],
    "July" : [4],
    "September" : [4],
    "November" : [23,24],
    "December" : [25]
  },
  rom : {
    "January" : [1,2,24],
    "April" : [16,17],
    "May" : [1],
    "June" : [1,4,5],
    "August" : [15],
    "November" : [30],
    "December" : [1, 25, 26]
  }
}

module.exports = config.rom;
},{}],2:[function(require,module,exports){
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
        
        this.totalDisplay = 0;

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
            jq : $('<p class="clickable"></p>'),
            type : ''
        };

        this.set_day(day, day_nr, fill);

        return day;
    }

    set_day(day, day_nr, fill) {
        day.jq.removeClass('fill');
        day.jq.removeClass('state_holiday');
        //day.jq.removeClass('clickable');

        day.jq.removeClass('weekend');
        if (fill) {
            day.nr = day_nr;
            day.day_of_week = -1;
            //day.jq.text('');
            utils.change_char_nice(day.jq, '');
            day.type ='fill';
            day.jq.addClass('fill');
            day.jq.removeClass('clickable');
        } else {
            day.nr = day_nr;
            day.day_of_week =  moment(this.year + ' ' + this.month + ' ' + day_nr, "YYYY MMMM DD").day();
            //day.jq.text(day.nr);
            utils.change_char_nice(day.jq, day.nr);
            day.type = day.day_of_week == 0 || day.day_of_week == 6 ? 'weekend' : 'normal';

            day.type = config[this.month] && config[this.month].filter((x) => x == day.nr).length ? 'state_holiday' : day.type;
            if (day.type == 'weekend') day.jq.addClass('weekend');
            if (day.type == 'state_holiday') day.jq.addClass('state_holiday');
            if (day.type != 'normal') {
                day.jq.removeClass('clickable');
            } else {
                day.jq.addClass('clickable');
            }
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

                timmer += 30;
            }

            setTimeout($.proxy(function(){

                this.days = this.days.filter((x) => x);
                this.preselect();
            }, this), timmer + 100);

        }, this));
    }

    select_interval() {
        this.jq.find('div.calendar').on('click', 'p', $.proxy(function(event){
            let day = $(event.currentTarget);
            let totalDisplay = $('div.main div.panel div div.month div.total p');

            if (day.hasClass('day_selected')) {
                this.days_selected = this.days_selected.remove(day.text());
                this.totalDisplay = this.totalDisplay - 1; 
                utils.change_char_nice(totalDisplay, this.totalDisplay);

                day.removeClass('day_selected');
            } else if (day.attr('class') == 'clickable') {
                this.days_selected.push(Number(day.text()));
                this.totalDisplay = this.totalDisplay + 1;
                utils.change_char_nice(totalDisplay, this.totalDisplay);

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
        this.totalDisplay = 0
        utils.change_char_nice($('div.main div.panel div div.month div.total p'), this.totalDisplay);
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
        this.table.on('renderIntervals', $.proxy(function(event, intitial_render){
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
                if (intitial_render) {
                    this.table.find('tbody tr').first().trigger('click');
                }
            }, this), 600);

        }, this));
    }

    set_panel_month() {
        this.table.on('click','tbody tr', function(event){
            console.log(event);
            let month = $(this).find('td').first().text();
            console.log(month);
            $('div.month_input p.month_text').trigger('month_changed', month);
        });
    }

    save_intervals() {
        $('div.actions div.savePTO').on('click', $.proxy(function(event) {
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

let que_single_char = [];
module.exports.change_char_nice = function(jq_obj, new_text) {
    que_single_char.push(new_text);
    jq_obj.removeClass('single_char_change');
    jq_obj.addClass('single_char_change');
    setTimeout(function(){
        jq_obj.text(que_single_char.shift());
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

                    $('div.display table').trigger('renderIntervals', 1);
                    //$('div.display table tbody tr').first().trigger('click');
                }, this));
            }
        }, this));
    }
}

module.exports = LogIn;
},{"./Utils.js":7}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkY6XFxub2RlanNcXG5ld19leHByZXNzXFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL2NvbmZpZy9ob2xpZGF5Q29uZmlnLmpzIiwiRjovbm9kZWpzL25ld19leHByZXNzL3B1YmxpYy9qYXZhc2NyaXB0cy9mYWtlX2Q2N2VmODhjLmpzIiwiRjovbm9kZWpzL25ld19leHByZXNzL3B1YmxpYy9qYXZhc2NyaXB0cy9tYWluX21vZHVsZXMvRGF5cy5qcyIsIkY6L25vZGVqcy9uZXdfZXhwcmVzcy9wdWJsaWMvamF2YXNjcmlwdHMvbWFpbl9tb2R1bGVzL0Rpc3BsYXlJbnRlcnZhbHMuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL21haW5fbW9kdWxlcy9IZWFkZXIuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL21haW5fbW9kdWxlcy9Nb250aC5qcyIsIkY6L25vZGVqcy9uZXdfZXhwcmVzcy9wdWJsaWMvamF2YXNjcmlwdHMvbWFpbl9tb2R1bGVzL1V0aWxzLmpzIiwiRjovbm9kZWpzL25ld19leHByZXNzL3B1YmxpYy9qYXZhc2NyaXB0cy9tYWluX21vZHVsZXMvbG9nSW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJsZXQgY29uZmlnID0ge1xyXG4gIHN1YSA6IHtcclxuICAgIFwiSmFudWFyeVwiIDogWzJdLFxyXG4gICAgXCJNYXlcIiA6IFsyOV0sXHJcbiAgICBcIkp1bHlcIiA6IFs0XSxcclxuICAgIFwiU2VwdGVtYmVyXCIgOiBbNF0sXHJcbiAgICBcIk5vdmVtYmVyXCIgOiBbMjMsMjRdLFxyXG4gICAgXCJEZWNlbWJlclwiIDogWzI1XVxyXG4gIH0sXHJcbiAgcm9tIDoge1xyXG4gICAgXCJKYW51YXJ5XCIgOiBbMSwyLDI0XSxcclxuICAgIFwiQXByaWxcIiA6IFsxNiwxN10sXHJcbiAgICBcIk1heVwiIDogWzFdLFxyXG4gICAgXCJKdW5lXCIgOiBbMSw0LDVdLFxyXG4gICAgXCJBdWd1c3RcIiA6IFsxNV0sXHJcbiAgICBcIk5vdmVtYmVyXCIgOiBbMzBdLFxyXG4gICAgXCJEZWNlbWJlclwiIDogWzEsIDI1LCAyNl1cclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gY29uZmlnLnJvbTsiLCJsZXQgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcvaG9saWRheUNvbmZpZy5qcycpO1xyXG5sZXQgTG9nSW4gPSByZXF1aXJlKCcuL21haW5fbW9kdWxlcy9sb2dJbi5qcycpO1xyXG5sZXQgSGVhZGVyID0gcmVxdWlyZSgnLi9tYWluX21vZHVsZXMvSGVhZGVyLmpzJyk7XHJcbmxldCBNb250aCA9IHJlcXVpcmUoJy4vbWFpbl9tb2R1bGVzL01vbnRoLmpzJyk7XHJcbmxldCBEYXlzID0gcmVxdWlyZSgnLi9tYWluX21vZHVsZXMvRGF5cy5qcycpO1xyXG5sZXQgRGlzcGxheUludGVydmFscyA9IHJlcXVpcmUoJy4vbWFpbl9tb2R1bGVzL0Rpc3BsYXlJbnRlcnZhbHMuanMnKTtcclxuXHJcbmxldCBzb3VyY2VfZGF0YSA9IHtcclxuICAgIHVzZXIgOiAnJyxcclxuICAgIHllYXI6ICcnLFxyXG4gICAgbW9udGhzOiB7fVxyXG59O1xyXG5cclxuaWYgKCFBcnJheS5wcm90b3R5cGUubGFzdCl7XHJcbiAgICBBcnJheS5wcm90b3R5cGUubGFzdCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNbdGhpcy5sZW5ndGggLSAxXTtcclxuICAgIH07XHJcbn1cclxuXHJcbmlmICghQXJyYXkucHJvdG90eXBlLnJlbW92ZSl7XHJcbiAgICBBcnJheS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24ocmVtb3ZlZF9lbGVtZW50KXtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgZWxlbWVudCBvZiB0aGlzKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50ICE9IHJlbW92ZWRfZWxlbWVudCkgcmVzdWx0LnB1c2goZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9O1xyXG59XHJcblxyXG4vLyAtLS0tLS0tLS0tIG1haW4gLS0tLS0tLS0tLS1cclxuXHJcbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xyXG4gICAgbGV0IGhlYWRlciA9IG5ldyBIZWFkZXIoKTtcclxuXHJcbiAgICBsZXQgbG9nSW4gPSBuZXcgTG9nSW4oc291cmNlX2RhdGEpO1xyXG4gICAgbG9nSW4uc2VuZF9pbnB1dF90ZXh0KGhlYWRlcik7XHJcblxyXG4gICAgJChkb2N1bWVudCkub24oJ3VzZXJfeWVhcl9zZXQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhzb3VyY2VfZGF0YSk7XHJcbiAgICAgICAgbGV0IHBhbmVsID0gbmV3IFBhbmVsKHNvdXJjZV9kYXRhLnllYXIpO1xyXG4gICAgICAgIHBhbmVsLmRheXMuc2VsZWN0X2ludGVydmFsKCk7XHJcbiAgICBcclxuICAgICAgICBsZXQgZGlzcGxheUludGVydmFscyA9IG5ldyBEaXNwbGF5SW50ZXJ2YWxzKHNvdXJjZV9kYXRhLnVzZXIsIHNvdXJjZV9kYXRhLnllYXIsIHNvdXJjZV9kYXRhKTtcclxuICAgICAgICBwYW5lbC5kYXlzLnNhdmVfaW50ZXJ2YWwoZGlzcGxheUludGVydmFscyk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4vLyAtLS0tLS0tLS0tIG1haW4gLS0tLS0tLS0tLS1cclxuXHJcbmNsYXNzIFBhbmVsIHtcclxuICAgIGNvbnN0cnVjdG9yKHllYXIpIHtcclxuICAgICAgICB0aGlzLnllYXIgPSB5ZWFyO1xyXG4gICAgICAgIHRoaXMuanEgPSAkKCdkaXYubWFpbiBkaXYucGFuZWwnKTtcclxuICAgICAgICB0aGlzLmpxLnJlbW92ZUNsYXNzKCdoaWRlJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5tb250aCA9IG5ldyBNb250aCgpO1xyXG4gICAgICAgIHRoaXMuZGF5cyA9IG5ldyBEYXlzKHRoaXMubW9udGgubW9udGgsIHllYXIsIHNvdXJjZV9kYXRhKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm1vbnRoLmNoYW5nZV9tb250aCh0aGlzLmRheXMpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubW9udGguY2hhbmdlX21vbnRoX3VwX2Rvd24oKTtcclxuICAgICAgICBcclxuICAgIH1cclxufVxyXG4iLCJsZXQgdXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzLmpzJyk7XHJcbmxldCBjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcvaG9saWRheUNvbmZpZy5qcycpO1xyXG5cclxuY2xhc3MgRGF5cyB7XHJcbiAgICBjb25zdHJ1Y3Rvcihtb250aCwgeWVhciwgc291cmNlX2RhdGEpIHtcclxuICAgICAgICB0aGlzLnNvdXJjZV9kYXRhID0gc291cmNlX2RhdGE7XHJcblxyXG4gICAgICAgIHRoaXMuanEgPSAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2LmNvbHVtbnMgZGl2LmRheXMnKTtcclxuXHJcbiAgICAgICAgdGhpcy5tb250aCA9IG1vbnRoO1xyXG4gICAgICAgIHRoaXMueWVhciA9IHllYXI7XHJcbiAgICAgICAgdGhpcy5kYXlzID0gW107XHJcbiAgICAgICAgdGhpcy5kYXlzX25hbWVzID0gWydNJywgJ1QnLCAnVycsICdUJywgJ0YnLCAnUycsICdTJ107XHJcbiAgICAgICAgdGhpcy50b3RhbF9kYXlzID0gJyc7XHJcbiAgICAgICAgdGhpcy5kYXlzX3NlbGVjdGVkID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdF9kYXlzKCk7XHJcbiAgICAgICAgdGhpcy5jaGFuZ2VfZGF5cygpO1xyXG4gICAgICAgIHRoaXMuY2xlYXIoKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnRvdGFsRGlzcGxheSA9IDA7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGluaXRfZGF5cygpIHtcclxuICAgICAgICB0aGlzLnRvdGFsX2RheXMgPSBtb21lbnQodGhpcy55ZWFyICsgJyAnICsgdGhpcy5tb250aCwgXCJZWVlZIE1NTU1cIikuZGF5c0luTW9udGgoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgZGF5X25yID0gMTsgZGF5X25yIDw9IHRoaXMudG90YWxfZGF5czsgZGF5X25yKyspIHtcclxuICAgICAgICAgICAgbGV0IGRheSA9IHRoaXMuY3JlYXRlX21vbnRoX2RheShkYXlfbnIpO1xyXG4gICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5jYWxlbmRhcicpLmFwcGVuZChkYXkuanEpO1xyXG4gICAgICAgICAgICB0aGlzLmRheXMucHVzaChkYXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgZmlyc3RfZGF5ID0gdGhpcy5kYXlzWzBdLmRheV9vZl93ZWVrO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDYgLSBmaXJzdF9kYXk7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgZmlsbF9kYXlfcHJlcHBlbmQgPSB0aGlzLmNyZWF0ZV9tb250aF9kYXkoMCwgMSk7XHJcbiAgICAgICAgICAgIHRoaXMuanEuZmluZCgnZGl2LmNhbGVuZGFyJykucHJlcGVuZChmaWxsX2RheV9wcmVwcGVuZC5qcSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF5cy51bnNoaWZ0KGZpbGxfZGF5X3ByZXBwZW5kKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSA2OyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5jYWxlbmRhcicpLnByZXBlbmQoYDxwIGNsYXNzPVwiZGF5c19uYW1lXCI+JHt0aGlzLmRheXNfbmFtZXNbaV19PC9wPmApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVfbW9udGhfZGF5KGRheV9uciwgZmlsbCkge1xyXG4gICAgICAgIGxldCBkYXkgPSB7XHJcbiAgICAgICAgICAgIG5yIDogJycsXHJcbiAgICAgICAgICAgIGRheV9vZl93ZWVrIDogJycsXHJcbiAgICAgICAgICAgIGpxIDogJCgnPHAgY2xhc3M9XCJjbGlja2FibGVcIj48L3A+JyksXHJcbiAgICAgICAgICAgIHR5cGUgOiAnJ1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2V0X2RheShkYXksIGRheV9uciwgZmlsbCk7XHJcblxyXG4gICAgICAgIHJldHVybiBkYXk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0X2RheShkYXksIGRheV9uciwgZmlsbCkge1xyXG4gICAgICAgIGRheS5qcS5yZW1vdmVDbGFzcygnZmlsbCcpO1xyXG4gICAgICAgIGRheS5qcS5yZW1vdmVDbGFzcygnc3RhdGVfaG9saWRheScpO1xyXG4gICAgICAgIC8vZGF5LmpxLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcclxuXHJcbiAgICAgICAgZGF5LmpxLnJlbW92ZUNsYXNzKCd3ZWVrZW5kJyk7XHJcbiAgICAgICAgaWYgKGZpbGwpIHtcclxuICAgICAgICAgICAgZGF5Lm5yID0gZGF5X25yO1xyXG4gICAgICAgICAgICBkYXkuZGF5X29mX3dlZWsgPSAtMTtcclxuICAgICAgICAgICAgLy9kYXkuanEudGV4dCgnJyk7XHJcbiAgICAgICAgICAgIHV0aWxzLmNoYW5nZV9jaGFyX25pY2UoZGF5LmpxLCAnJyk7XHJcbiAgICAgICAgICAgIGRheS50eXBlID0nZmlsbCc7XHJcbiAgICAgICAgICAgIGRheS5qcS5hZGRDbGFzcygnZmlsbCcpO1xyXG4gICAgICAgICAgICBkYXkuanEucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRheS5uciA9IGRheV9ucjtcclxuICAgICAgICAgICAgZGF5LmRheV9vZl93ZWVrID0gIG1vbWVudCh0aGlzLnllYXIgKyAnICcgKyB0aGlzLm1vbnRoICsgJyAnICsgZGF5X25yLCBcIllZWVkgTU1NTSBERFwiKS5kYXkoKTtcclxuICAgICAgICAgICAgLy9kYXkuanEudGV4dChkYXkubnIpO1xyXG4gICAgICAgICAgICB1dGlscy5jaGFuZ2VfY2hhcl9uaWNlKGRheS5qcSwgZGF5Lm5yKTtcclxuICAgICAgICAgICAgZGF5LnR5cGUgPSBkYXkuZGF5X29mX3dlZWsgPT0gMCB8fCBkYXkuZGF5X29mX3dlZWsgPT0gNiA/ICd3ZWVrZW5kJyA6ICdub3JtYWwnO1xyXG5cclxuICAgICAgICAgICAgZGF5LnR5cGUgPSBjb25maWdbdGhpcy5tb250aF0gJiYgY29uZmlnW3RoaXMubW9udGhdLmZpbHRlcigoeCkgPT4geCA9PSBkYXkubnIpLmxlbmd0aCA/ICdzdGF0ZV9ob2xpZGF5JyA6IGRheS50eXBlO1xyXG4gICAgICAgICAgICBpZiAoZGF5LnR5cGUgPT0gJ3dlZWtlbmQnKSBkYXkuanEuYWRkQ2xhc3MoJ3dlZWtlbmQnKTtcclxuICAgICAgICAgICAgaWYgKGRheS50eXBlID09ICdzdGF0ZV9ob2xpZGF5JykgZGF5LmpxLmFkZENsYXNzKCdzdGF0ZV9ob2xpZGF5Jyk7XHJcbiAgICAgICAgICAgIGlmIChkYXkudHlwZSAhPSAnbm9ybWFsJykge1xyXG4gICAgICAgICAgICAgICAgZGF5LmpxLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRheS5qcS5hZGRDbGFzcygnY2xpY2thYmxlJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNoYW5nZV9kYXlzKCkge1xyXG4gICAgICAgIHRoaXMuanEub24oJ21vbnRoX2NoYW5nZWQnLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50LCBtb250aCkge1xyXG4gICAgICAgICAgICB0aGlzLmNsZWFyX3NlbGVjdCgpO1xyXG4gICAgICAgICAgICB0aGlzLm1vbnRoID0gbW9udGg7XHJcbiAgICAgICAgICAgIHRoaXMudG90YWxfZGF5cyA9IG1vbWVudCh0aGlzLnllYXIgKyAnICcgKyB0aGlzLm1vbnRoLCBcIllZWVkgTU1NTVwiKS5kYXlzSW5Nb250aCgpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGZpcnN0X3dlZWtfZGF5ID0gbW9tZW50KHRoaXMueWVhciArICcgJyArIHRoaXMubW9udGggKyAnICcgKyAxLCBcIllZWVkgTU1NTSBERFwiKS5kYXkoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCB0b3RhbF9mb3JfbGVuZ2h0ID0gdGhpcy50b3RhbF9kYXlzICsgKGZpcnN0X3dlZWtfZGF5ID09IDAgPyA2IDogZmlyc3Rfd2Vla19kYXkgLSAxKTtcclxuICAgICAgICAgICAgdG90YWxfZm9yX2xlbmdodCA9IHRvdGFsX2Zvcl9sZW5naHQgPiB0aGlzLmRheXMubGVuZ3RoID8gdG90YWxfZm9yX2xlbmdodCA6IHRoaXMuZGF5cy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGxldCBjdXJyZW50X21tb250aF9kYXlfbnIgPSAxO1xyXG5cclxuICAgICAgICAgICAgbGV0IHRpbW1lciA9IDA7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxfZm9yX2xlbmdodDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCQucHJveHkoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kYXlzW2ldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoZmlyc3Rfd2Vla19kYXkgPT0gMCAmJiBpIDwgNikgfHwgKGZpcnN0X3dlZWtfZGF5ID4gaSArIDEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldF9kYXkodGhpcy5kYXlzW2ldLCAwLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50X21tb250aF9kYXlfbnIgPD0gdGhpcy50b3RhbF9kYXlzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldF9kYXkodGhpcy5kYXlzW2ldLCBjdXJyZW50X21tb250aF9kYXlfbnIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudF9tbW9udGhfZGF5X25yKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRheXNbaV0uanEucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRheXNbaV0gPSAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBkYXkgPSB0aGlzLmNyZWF0ZV9tb250aF9kYXkoY3VycmVudF9tbW9udGhfZGF5X25yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYuY2FsZW5kYXInKS5hcHBlbmQoZGF5LmpxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXlzLnB1c2goZGF5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudF9tbW9udGhfZGF5X25yKys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwgdGhpcyksIHRpbW1lcik7XHJcblxyXG4gICAgICAgICAgICAgICAgdGltbWVyICs9IDMwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCQucHJveHkoZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRheXMgPSB0aGlzLmRheXMuZmlsdGVyKCh4KSA9PiB4KTtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJlc2VsZWN0KCk7XHJcbiAgICAgICAgICAgIH0sIHRoaXMpLCB0aW1tZXIgKyAxMDApO1xyXG5cclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2VsZWN0X2ludGVydmFsKCkge1xyXG4gICAgICAgIHRoaXMuanEuZmluZCgnZGl2LmNhbGVuZGFyJykub24oJ2NsaWNrJywgJ3AnLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgICAgbGV0IGRheSA9ICQoZXZlbnQuY3VycmVudFRhcmdldCk7XHJcbiAgICAgICAgICAgIGxldCB0b3RhbERpc3BsYXkgPSAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2IGRpdi5tb250aCBkaXYudG90YWwgcCcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRheS5oYXNDbGFzcygnZGF5X3NlbGVjdGVkJykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF5c19zZWxlY3RlZCA9IHRoaXMuZGF5c19zZWxlY3RlZC5yZW1vdmUoZGF5LnRleHQoKSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvdGFsRGlzcGxheSA9IHRoaXMudG90YWxEaXNwbGF5IC0gMTsgXHJcbiAgICAgICAgICAgICAgICB1dGlscy5jaGFuZ2VfY2hhcl9uaWNlKHRvdGFsRGlzcGxheSwgdGhpcy50b3RhbERpc3BsYXkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGRheS5yZW1vdmVDbGFzcygnZGF5X3NlbGVjdGVkJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF5LmF0dHIoJ2NsYXNzJykgPT0gJ2NsaWNrYWJsZScpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF5c19zZWxlY3RlZC5wdXNoKE51bWJlcihkYXkudGV4dCgpKSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvdGFsRGlzcGxheSA9IHRoaXMudG90YWxEaXNwbGF5ICsgMTtcclxuICAgICAgICAgICAgICAgIHV0aWxzLmNoYW5nZV9jaGFyX25pY2UodG90YWxEaXNwbGF5LCB0aGlzLnRvdGFsRGlzcGxheSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZGF5LmFkZENsYXNzKCdkYXlfc2VsZWN0ZWQnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuXHJcbiAgICAgICAgdGhpcy5wcmVzZWxlY3QoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcmVzZWxlY3QoKSB7XHJcbiAgICAgICAgaWYodGhpcy5zb3VyY2VfZGF0YS5tb250aHNbdGhpcy5tb250aF0pIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgZGF5X3NlbGVjdGVkIG9mIHRoaXMuc291cmNlX2RhdGEubW9udGhzW3RoaXMubW9udGhdKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBjdXJyZW50X2RheSBvZiB0aGlzLmRheXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudF9kYXkubnIgPT0gZGF5X3NlbGVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfZGF5LmpxLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGVhcigpIHtcclxuICAgICAgICAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2LmFjdGlvbnMgZGl2LmNsZWFyX3NlbGVjdGlvbicpLm9uKCdjbGljaycsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpcmVkJyk7XHJcbiAgICAgICAgICAgIHRoaXMuY2xlYXJfc2VsZWN0KCk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnNvdXJjZV9kYXRhLm1vbnRoc1t0aGlzLm1vbnRoXTtcclxuICAgICAgICAgICAgJCgnZGl2Lm1haW4gZGl2LnBhbmVsIGRpdi5kaXNwbGF5IHRhYmxlJykudHJpZ2dlcigncmVuZGVySW50ZXJ2YWxzJyk7XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyX3NlbGVjdCgpIHtcclxuICAgICAgICBmb3IgKGxldCBkYXkgb2YgdGhpcy5kYXlzKSB7XHJcbiAgICAgICAgICAgIGRheS5qcS5yZW1vdmVDbGFzcygnZGF5X3NlbGVjdGVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZGF5c19zZWxlY3RlZCA9IFtdO1xyXG4gICAgICAgIHRoaXMudG90YWxEaXNwbGF5ID0gMFxyXG4gICAgICAgIHV0aWxzLmNoYW5nZV9jaGFyX25pY2UoJCgnZGl2Lm1haW4gZGl2LnBhbmVsIGRpdiBkaXYubW9udGggZGl2LnRvdGFsIHAnKSwgdGhpcy50b3RhbERpc3BsYXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmVfaW50ZXJ2YWwoZGlzcGxheSkge1xyXG5cclxuICAgICAgICB0aGlzLmpxLnBhcmVudCgpLmZpbmQoJ2Rpdi5hY3Rpb25zIGRpdi5zYXZlX2ludGVydmFsJykub24oJ2NsaWNrJywgJC5wcm94eShmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5kYXlzX3NlbGVjdGVkLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zb3VyY2VfZGF0YS5tb250aHNbdGhpcy5tb250aF0gPSB0aGlzLmRheXNfc2VsZWN0ZWQ7XHJcbiAgICAgICAgICAgICAgICBkaXNwbGF5LnRhYmxlLnRyaWdnZXIoJ3JlbmRlckludGVydmFscycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuc291cmNlX2RhdGEpO1xyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRGF5cztcclxuIiwibGV0IHV0aWxzID0gcmVxdWlyZSgnLi9VdGlscy5qcycpO1xyXG5cclxuY2xhc3MgRGlzcGxheUludGVydmFscyB7XHJcbiAgICBjb25zdHJ1Y3Rvcih1c2VyLCB5ZWFyLCBzb3VyY2VfZGF0YSkge1xyXG4gICAgICAgIHRoaXMuc291cmNlX2RhdGEgPSBzb3VyY2VfZGF0YTtcclxuXHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuZGlzcGxheScpO1xyXG4gICAgICAgIHRoaXMuanEucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcclxuXHJcbiAgICAgICAgdGhpcy50YWJsZSA9IHRoaXMuanEuZmluZCgndGFibGUnKTtcclxuICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xyXG4gICAgICAgIHRoaXMueWVhciA9IHllYXI7XHJcbiAgICAgICAgLy90aGlzLnNhdmVfZGF0YSA9IHt9O1xyXG5cclxuICAgICAgICB0aGlzLnRvZ2dsZV9wYW5lbCgpO1xyXG4gICAgICAgIHRoaXMucmVuZGVyX2ludGVydmFscygpO1xyXG4gICAgICAgIHRoaXMuc2V0X3BhbmVsX21vbnRoKCk7XHJcbiAgICAgICAgdGhpcy5zYXZlX2ludGVydmFscygpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICB0b2dnbGVfcGFuZWwoKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdwLnRpdGxlIHNwYW4nKS5vbignY2xpY2snLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuY29sdW1ucycpLnRvZ2dsZUNsYXNzKCdoaWRlJyk7XHJcbiAgICAgICAgICAgIHRoaXMuanEuZmluZCgncC5zYXZlUFRPJykudG9nZ2xlQ2xhc3MoJ2hpZGUnKTtcclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyX2ludGVydmFscygpIHtcclxuICAgICAgICB0aGlzLnRhYmxlLm9uKCdyZW5kZXJJbnRlcnZhbHMnLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50LCBpbnRpdGlhbF9yZW5kZXIpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnNvdXJjZV9kYXRhLm1vbnRocyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRhYmxlLmFkZENsYXNzKCdoaWRlX2Zvcl9yZW5kZXInKTtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgkLnByb3h5KGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy50YWJsZS5maW5kKCd0Ym9keScpLmh0bWwoJycpO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbW9udGggaW4gdGhpcy5zb3VyY2VfZGF0YS5tb250aHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcm93ID0gJCgnPHRyPjwvdHI+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcm93LmFwcGVuZChgPHRkPiR7bW9udGh9PC90ZD5gKTtcclxuICAgICAgICAgICAgICAgICAgICByb3cuYXBwZW5kKGA8dGQ+JHt0aGlzLnNvdXJjZV9kYXRhLm1vbnRoc1ttb250aF0uam9pbignLCcpfTwvdGQ+YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcm93LmFwcGVuZChgPHRkPiR7dGhpcy5zb3VyY2VfZGF0YS5tb250aHNbbW9udGhdLmxlbmd0aCB9PC90ZD5gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50YWJsZS5maW5kKCd0Ym9keScpLmFwcGVuZChyb3cpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5rZXlzKHRoaXMuc291cmNlX2RhdGEubW9udGhzKSk7XHJcbiAgICAgICAgICAgICAgICB1dGlscy5jaGFuZ2VfY2hhcl9uaWNlKHRoaXMuanEuZmluZCgnZGl2LnRvdGFsWWVhciBwLnRvdGFsJyksIE9iamVjdC5rZXlzKHRoaXMuc291cmNlX2RhdGEubW9udGhzKS5yZWR1Y2UoXHJcbiAgICAgICAgICAgICAgICAgICAgKHN1bSwgeCkgPT4gc3VtICsgdGhpcy5zb3VyY2VfZGF0YS5tb250aHNbeF0ubGVuZ3RoXHJcbiAgICAgICAgICAgICAgICAgICAgLCAwKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy50YWJsZS5yZW1vdmVDbGFzcygnaGlkZV9mb3JfcmVuZGVyJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW50aXRpYWxfcmVuZGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50YWJsZS5maW5kKCd0Ym9keSB0cicpLmZpcnN0KCkudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgdGhpcyksIDYwMCk7XHJcblxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRfcGFuZWxfbW9udGgoKSB7XHJcbiAgICAgICAgdGhpcy50YWJsZS5vbignY2xpY2snLCd0Ym9keSB0cicsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZXZlbnQpO1xyXG4gICAgICAgICAgICBsZXQgbW9udGggPSAkKHRoaXMpLmZpbmQoJ3RkJykuZmlyc3QoKS50ZXh0KCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1vbnRoKTtcclxuICAgICAgICAgICAgJCgnZGl2Lm1vbnRoX2lucHV0IHAubW9udGhfdGV4dCcpLnRyaWdnZXIoJ21vbnRoX2NoYW5nZWQnLCBtb250aCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZV9pbnRlcnZhbHMoKSB7XHJcbiAgICAgICAgJCgnZGl2LmFjdGlvbnMgZGl2LnNhdmVQVE8nKS5vbignY2xpY2snLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuc291cmNlX2RhdGEpO1xyXG4gICAgICAgICAgICAkLnBvc3QoIFwiL3VwZGF0ZVwiLCB0aGlzLnNvdXJjZV9kYXRhLCBmdW5jdGlvbiggZGF0YSApIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEucmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERpc3BsYXlJbnRlcnZhbHM7IiwibGV0IHV0aWxzID0gcmVxdWlyZSgnLi9VdGlscy5qcycpO1xyXG5cclxuY2xhc3MgSGVhZGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuanEgPSAkKCdkaXYuaGVhZGVyJyk7XHJcbiAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMuanEuZmluZCgnc3BhbicpLnRleHQoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRfdXNlcih1c2VyX25hbWUpIHtcclxuICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi51c2VyJykuY3NzKCdvcGFjaXR5JywgJzEnKTtcclxuICAgICAgICB1dGlscy5yYW5kb21fdGV4dF9jaGFuZ2UodGhpcy5qcS5maW5kKCdwJykuZmlyc3QoKSwgdXNlcl9uYW1lLCAxMDApO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZXRfeWVhcih5ZWFyKSB7XHJcblxyXG4gICAgICAgIGlmICgvIC0gXFxkezR9Ly50ZXN0KHRoaXMudGl0bGUpKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coeWVhcik7XHJcbiAgICAgICAgICAgIHRoaXMudGl0bGUgPSB0aGlzLnRpdGxlLnJlcGxhY2UoL1xcZHs0fS8sIHllYXIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMudGl0bGUgPSB0aGlzLnRpdGxlICsgJyAtICcgKyB5ZWFyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXRpbHMucmFuZG9tX3RleHRfY2hhbmdlKHRoaXMuanEuZmluZCgnc3BhbicpLmZpcnN0KCksIHRoaXMudGl0bGUsIDEwMCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSGVhZGVyOyIsImxldCB1dGlscyA9IHJlcXVpcmUoJy4vVXRpbHMuanMnKTtcclxuXHJcbmNsYXNzIE1vbnRoIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuanEgPSAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2LmNvbHVtbnMgZGl2Lm1vbnRoJyk7XHJcbiAgICAgICAgdGhpcy5tb250aCA9IHRoaXMuanEuZmluZCgncC5tb250aF90ZXh0JykudGV4dCgpO1xyXG4gICAgICAgIHRoaXMubW9udGhzX2luX3llYXIgPSBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRfbW9udGgobW9udGgpIHtcclxuICAgICAgICB0aGlzLm1vbnRoID0gbW9udGg7XHJcbiAgICAgICAgdXRpbHMucmFuZG9tX3RleHRfY2hhbmdlKHRoaXMuanEuZmluZCgncC5tb250aF90ZXh0JykuZmlyc3QoKSxtb250aCwgMTAwKTtcclxuICAgIH1cclxuXHJcbiAgICBjaGFuZ2VfbW9udGhfdXBfZG93bigpIHtcclxuICAgICAgICB0aGlzLmpxLmZpbmQoJ3AudXAscC5kb3duJykub24oJ2NsaWNrJywgJC5wcm94eShmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm1vbnRoc19pbl95ZWFyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tb250aCA9PSB0aGlzLm1vbnRoc19pbl95ZWFyW2ldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5leHRfbW9udGggPSAodGhpcy5tb250aHNfaW5feWVhcltpICsgMV0gfHwgdGhpcy5tb250aHNfaW5feWVhclswXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHByZXZpb3VzX21vbnRoID0gKHRoaXMubW9udGhzX2luX3llYXJbaSAtIDFdIHx8IHRoaXMubW9udGhzX2luX3llYXIubGFzdCgpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJChldmVudC5jdXJyZW50VGFyZ2V0KS5oYXNDbGFzcygndXAnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldF9tb250aChuZXh0X21vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldF9tb250aChwcmV2aW91c19tb250aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuanEuZmluZCgncC5tb250aF90ZXh0JykudHJpZ2dlcignbW9udGhfY2hhbmdlZCcsIHRoaXMubW9udGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBjaGFuZ2VfbW9udGgoZGF5cykge1xyXG4gICAgICAgIHRoaXMuanEuZmluZCgncC5tb250aF90ZXh0Jykub24oJ21vbnRoX2NoYW5nZWQnLCAkLnByb3h5KGZ1bmN0aW9uIChldmVudCwgbW9udGgpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRfbW9udGgobW9udGgpO1xyXG4gICAgICAgICAgICBkYXlzLmpxLnRyaWdnZXIoJ21vbnRoX2NoYW5nZWQnLCB0aGlzLm1vbnRoKTtcclxuICAgICAgICB9LHRoaXMpKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb250aDsiLCJtb2R1bGUuZXhwb3J0cy5yYW5kb21fdGV4dF9jaGFuZ2UgPSAgZnVuY3Rpb24gKGpxX29iaiwgdGV4dF9uZXcsIHRpbW1lcikge1xyXG5cclxuICAgIGxldCBbLHdpZHRoXSA9IC8oXFxkKykvLmV4ZWMoanFfb2JqLmNzcygnZm9udC1zaXplJykpO1xyXG5cclxuICAgIGxldCByYW5kb21fY2hhbmdlX3N0eWxlID0gJCgnPHN0eWxlIHR5cGU9XCJ0ZXh0L2Nzc1wiPjwvc3R5bGU+Jyk7XHJcbiAgICByYW5kb21fY2hhbmdlX3N0eWxlLnRleHQoXHJcbiAgICAgICAgJy5yYW5kb21fY2hhbmdlIHsgZGlzcGxheTppbmxpbmUtYmxvY2s7IG1pbi13aWR0aDogMHB4OyB0cmFuc2l0aW9uOiBhbGwgJyArIHRpbW1lciAvIDEwMDAgKyAnczt9ICcgK1xyXG4gICAgICAgICcucmFuZG9tX2NoYW5nZV9zcGFuX2hpZGUgeyBtaW4td2lkdGg6ICcgKyB3aWR0aC8yICsgJ3B4OyBvcGFjaXR5OjA7IH0gJyArXHJcbiAgICAgICAgJy5yYW5kb21fY2hhbmdlX3NwYW5fcmVtb3ZlIHsgbWluLXdpZHRoOiAnICsgd2lkdGgvMiArICdweDsgb3BhY2l0eTowOyB9J1xyXG4gICAgKTtcclxuICAgICQoJ2hlYWQnKS5wcmVwZW5kKHJhbmRvbV9jaGFuZ2Vfc3R5bGUpO1xyXG5cclxuICAgIGxldCBjaGFyc19uZXcgPSB0ZXh0X25ldy5zcGxpdCgnJyk7XHJcbiAgICBsZXQgY2hhcnNfb3JnID0ganFfb2JqLnRleHQoKS5zcGxpdCgnJyk7XHJcbiAgICBsZXQgbWF4X25yID0gY2hhcnNfbmV3Lmxlbmd0aCA+IGNoYXJzX29yZy5sZW5ndGggPyBjaGFyc19uZXcubGVuZ3RoIDogY2hhcnNfb3JnLmxlbmd0aDtcclxuXHJcbiAgICBqcV9vYmoudGV4dCgnJyk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1heF9ucjsgaSsrKSB7XHJcbiAgICAgICAgaWYgKGNoYXJzX29yZ1tpXSkge1xyXG4gICAgICAgICAgICBjaGFyc19vcmdbaV0gPSAkKGA8c3BhbiBjbGFzcz0ncmFuZG9tX2NoYW5nZSc+JHtjaGFyc19vcmdbaV19PC9zcGFuPmApO1xyXG4gICAgICAgICAgICBjaGFyc19vcmdbaV07XHJcbiAgICAgICAgICAgIGlmIChjaGFyc19vcmdbaV0udGV4dCgpID09ICcgJykge1xyXG4gICAgICAgICAgICAgICAgY2hhcnNfb3JnW2ldLmNzcygnbWluLXdpZHRoJywgd2lkdGgvMy0xICsgJ3B4Jyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY2hhcnNfb3JnW2ldID0gJChgPHNwYW4gY2xhc3M9J3JhbmRvbV9jaGFuZ2UnPjwvc3Bhbj5gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGpxX29iai5hcHBlbmQoY2hhcnNfb3JnW2ldKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgY291bnRlciA9IFsuLi5BcnJheShtYXhfbnIpLmtleXMoKV07XHJcblxyXG4gICAgY291bnRlci5zaHVmZmxlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGkgPSB0aGlzLmxlbmd0aCwgaiwgdGVtcDtcclxuICAgICAgICBpZiAoIGkgPT0gMCApIHJldHVybiB0aGlzO1xyXG4gICAgICAgIHdoaWxlICggLS1pICkge1xyXG4gICAgICAgICAgICBqID0gTWF0aC5mbG9vciggTWF0aC5yYW5kb20oKSAqICggaSArIDEgKSApO1xyXG4gICAgICAgICAgICB0ZW1wID0gdGhpc1tpXTtcclxuICAgICAgICAgICAgdGhpc1tpXSA9IHRoaXNbal07XHJcbiAgICAgICAgICAgIHRoaXNbal0gPSB0ZW1wO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgY291bnRlciA9IGNvdW50ZXIuc2h1ZmZsZSgpO1xyXG4gICAgbGV0IGluaXRpYWxfdGltZSA9IHRpbW1lcjtcclxuICAgIGZvciAobGV0IGluZGV4IG9mIGNvdW50ZXIpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGNoYXJzX29yZ1tpbmRleF0gIT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGNoYXJzX25ld1tpbmRleF0gIT0gJ3VuZGVmaW5lZCcpIHtcclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFyc19vcmdbaW5kZXhdLmFkZENsYXNzKCdyYW5kb21fY2hhbmdlX3NwYW5faGlkZScpO1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hhcnNfbmV3W2luZGV4XSA9PSAnICcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhcnNfb3JnW2luZGV4XS5jc3MoJ3dpZHRoJywgJzhweCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjaGFyc19vcmdbaW5kZXhdLnRleHQoY2hhcnNfbmV3W2luZGV4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhcnNfb3JnW2luZGV4XS5yZW1vdmVDbGFzcygncmFuZG9tX2NoYW5nZV9zcGFuX2hpZGUnKTtcclxuICAgICAgICAgICAgICAgIH0saW5pdGlhbF90aW1lKVxyXG5cclxuICAgICAgICAgICAgfSwgdGltbWVyKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY2hhcnNfbmV3W2luZGV4XSA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhcnNfb3JnW2luZGV4XS5hZGRDbGFzcygncmFuZG9tX2NoYW5nZV9zcGFuX3JlbW92ZScpO1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0ucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICB9LCBpbml0aWFsX3RpbWUpO1xyXG4gICAgICAgICAgICB9LCB0aW1tZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGltbWVyICs9IGluaXRpYWxfdGltZTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGpxX29iai5odG1sKGpxX29iai50ZXh0KCkpO1xyXG4gICAgICAgIHJhbmRvbV9jaGFuZ2Vfc3R5bGUucmVtb3ZlKCk7XHJcblxyXG4gICAgfSwgaW5pdGlhbF90aW1lICsgdGltbWVyKTtcclxuXHJcbn1cclxuXHJcbmxldCBxdWVfc2luZ2xlX2NoYXIgPSBbXTtcclxubW9kdWxlLmV4cG9ydHMuY2hhbmdlX2NoYXJfbmljZSA9IGZ1bmN0aW9uKGpxX29iaiwgbmV3X3RleHQpIHtcclxuICAgIHF1ZV9zaW5nbGVfY2hhci5wdXNoKG5ld190ZXh0KTtcclxuICAgIGpxX29iai5yZW1vdmVDbGFzcygnc2luZ2xlX2NoYXJfY2hhbmdlJyk7XHJcbiAgICBqcV9vYmouYWRkQ2xhc3MoJ3NpbmdsZV9jaGFyX2NoYW5nZScpO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgIGpxX29iai50ZXh0KHF1ZV9zaW5nbGVfY2hhci5zaGlmdCgpKTtcclxuICAgIH0sIDI1MCk7XHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAganFfb2JqLnJlbW92ZUNsYXNzKCdzaW5nbGVfY2hhcl9jaGFuZ2UnKTtcclxuICAgIH0sIDYwMCk7XHJcbn1cclxuIiwibGV0IHV0aWxzID0gcmVxdWlyZSgnLi9VdGlscy5qcycpO1xyXG5cclxuY2xhc3MgTG9nSW4ge1xyXG4gICAgY29uc3RydWN0b3Ioc291cmNlX2RhdGEpIHtcclxuICAgICAgICB0aGlzLnNvdXJjZV9kYXRhID0gc291cmNlX2RhdGE7XHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5sb2dfaW4nKTtcclxuICAgICAgICB0aGlzLm1lc3NhZ2UgPSAnTG9nIGluIHdpdGggZW1haWwnO1xyXG4gICAgICAgIHRoaXMudXNlciA9ICcnO1xyXG4gICAgfVxyXG5cclxuICAgIHNldF9tZXNzYWplKG1lc3NhamUpIHtcclxuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWplO1xyXG4gICAgICAgIHV0aWxzLnJhbmRvbV90ZXh0X2NoYW5nZSh0aGlzLmpxLmZpbmQoJ3AnKS5maXJzdCgpLCBtZXNzYWplLCAxMDApO1xyXG4gICAgfVxyXG5cclxuICAgIHNlbmRfaW5wdXRfdGV4dChoZWFkZXIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5qcS5maW5kKCdpbnB1dCcpLm9uKCdrZXlwcmVzcycsICQucHJveHkoIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC5rZXkgPT0gJ0VudGVyJyAmJiAhdGhpcy51c2VyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXIgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLnZhbCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGhlYWRlci5zZXRfdXNlcih0aGlzLnVzZXIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zb3VyY2VfZGF0YS51c2VyID0gdGhpcy51c2VyO1xyXG4gICAgICAgICAgICAgICAgaGVhZGVyLmpxLmZpbmQoJ2Rpdi51c2VyJykucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldF9tZXNzYWplKCdQbGVhc2UgY2hvb3NlIHllYXInKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuanEuZmluZCgnaW5wdXQnKS52YWwoJycpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmtleSA9PSAnRW50ZXInKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnllYXIgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKC9eXFxkezR9JC8udGVzdCh0aGlzLnllYXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyLnNldF95ZWFyKHRoaXMueWVhcik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5qcS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZV9kYXRhLnllYXIgPSB0aGlzLnllYXI7XHJcblxyXG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcigndXNlcl95ZWFyX3NldCcpO1xyXG5cclxuICAgICAgICAgICAgICAgICQuZ2V0KCBcIi9jaGVja19kYXRhXCIsIHt1c2VyIDogdGhpcy51c2VyLCB5ZWFyOiB0aGlzLnllYXJ9LCAkLnByb3h5KGZ1bmN0aW9uKCBkYXRhICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuc291cmNlX2RhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc291cmNlX2RhdGEubW9udGhzID0gZGF0YS5yZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJCgnZGl2LmRpc3BsYXkgdGFibGUnKS50cmlnZ2VyKCdyZW5kZXJJbnRlcnZhbHMnLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyQoJ2Rpdi5kaXNwbGF5IHRhYmxlIHRib2R5IHRyJykuZmlyc3QoKS50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgICAgICAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExvZ0luOyJdfQ==
