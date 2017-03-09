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

module.exports.get_url_params = function(param) {
    let url = window.location.href;

    let result = new RegExp('[\?&]' + param + '=([^&#]*)').exec(window.location.href);
    result = result&&result[1];
    if(!result) window.location.replace('/');

    return result;
}

module.exports.animate_wrong = function(jq_obj) {
    jq_obj.addClass('wrong_val');
    let animation_time = Number(/([\d\.]+)/.exec(jq_obj.css('animation'))[1]);
    setTimeout($.proxy(function() {
        this.removeClass('wrong_val');
    }, jq_obj), animation_time * 1000)
}

module.exports.sendJson = function(url, json) {
   return new Promise(function(resolve, reject) {
        $.ajax({
            url: url,
            type: 'POST',
            data: JSON.stringify(json),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function(msg) {
                resolve(msg)
            }
        }).fail(function(err) {
            reject(Error(err));
        });
   });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkY6XFxub2RlanNcXG5ld19leHByZXNzXFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL2NvbmZpZy9ob2xpZGF5Q29uZmlnLmpzIiwiRjovbm9kZWpzL25ld19leHByZXNzL3B1YmxpYy9qYXZhc2NyaXB0cy9mYWtlX2RhOGE2MDQwLmpzIiwiRjovbm9kZWpzL25ld19leHByZXNzL3B1YmxpYy9qYXZhc2NyaXB0cy9tYWluX21vZHVsZXMvRGF5cy5qcyIsIkY6L25vZGVqcy9uZXdfZXhwcmVzcy9wdWJsaWMvamF2YXNjcmlwdHMvbWFpbl9tb2R1bGVzL0Rpc3BsYXlJbnRlcnZhbHMuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL21haW5fbW9kdWxlcy9IZWFkZXIuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL21haW5fbW9kdWxlcy9Nb250aC5qcyIsIkY6L25vZGVqcy9uZXdfZXhwcmVzcy9wdWJsaWMvamF2YXNjcmlwdHMvbWFpbl9tb2R1bGVzL1V0aWxzLmpzIiwiRjovbm9kZWpzL25ld19leHByZXNzL3B1YmxpYy9qYXZhc2NyaXB0cy9tYWluX21vZHVsZXMvbG9nSW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImxldCBjb25maWcgPSB7XHJcbiAgc3VhIDoge1xyXG4gICAgXCJKYW51YXJ5XCIgOiBbMl0sXHJcbiAgICBcIk1heVwiIDogWzI5XSxcclxuICAgIFwiSnVseVwiIDogWzRdLFxyXG4gICAgXCJTZXB0ZW1iZXJcIiA6IFs0XSxcclxuICAgIFwiTm92ZW1iZXJcIiA6IFsyMywyNF0sXHJcbiAgICBcIkRlY2VtYmVyXCIgOiBbMjVdXHJcbiAgfSxcclxuICByb20gOiB7XHJcbiAgICBcIkphbnVhcnlcIiA6IFsxLDIsMjRdLFxyXG4gICAgXCJBcHJpbFwiIDogWzE2LDE3XSxcclxuICAgIFwiTWF5XCIgOiBbMV0sXHJcbiAgICBcIkp1bmVcIiA6IFsxLDQsNV0sXHJcbiAgICBcIkF1Z3VzdFwiIDogWzE1XSxcclxuICAgIFwiTm92ZW1iZXJcIiA6IFszMF0sXHJcbiAgICBcIkRlY2VtYmVyXCIgOiBbMSwgMjUsIDI2XVxyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBjb25maWcucm9tOyIsImxldCBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZy9ob2xpZGF5Q29uZmlnLmpzJyk7XHJcbmxldCBMb2dJbiA9IHJlcXVpcmUoJy4vbWFpbl9tb2R1bGVzL2xvZ0luLmpzJyk7XHJcbmxldCBIZWFkZXIgPSByZXF1aXJlKCcuL21haW5fbW9kdWxlcy9IZWFkZXIuanMnKTtcclxubGV0IE1vbnRoID0gcmVxdWlyZSgnLi9tYWluX21vZHVsZXMvTW9udGguanMnKTtcclxubGV0IERheXMgPSByZXF1aXJlKCcuL21haW5fbW9kdWxlcy9EYXlzLmpzJyk7XHJcbmxldCBEaXNwbGF5SW50ZXJ2YWxzID0gcmVxdWlyZSgnLi9tYWluX21vZHVsZXMvRGlzcGxheUludGVydmFscy5qcycpO1xyXG5cclxubGV0IHNvdXJjZV9kYXRhID0ge1xyXG4gICAgdXNlciA6ICcnLFxyXG4gICAgeWVhcjogJycsXHJcbiAgICBtb250aHM6IHt9XHJcbn07XHJcblxyXG5pZiAoIUFycmF5LnByb3RvdHlwZS5sYXN0KXtcclxuICAgIEFycmF5LnByb3RvdHlwZS5sYXN0ID0gZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gdGhpc1t0aGlzLmxlbmd0aCAtIDFdO1xyXG4gICAgfTtcclxufVxyXG5cclxuaWYgKCFBcnJheS5wcm90b3R5cGUucmVtb3ZlKXtcclxuICAgIEFycmF5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihyZW1vdmVkX2VsZW1lbnQpe1xyXG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBlbGVtZW50IG9mIHRoaXMpIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1lbnQgIT0gcmVtb3ZlZF9lbGVtZW50KSByZXN1bHQucHVzaChlbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH07XHJcbn1cclxuXHJcbi8vIC0tLS0tLS0tLS0gbWFpbiAtLS0tLS0tLS0tLVxyXG5cclxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XHJcbiAgICBsZXQgaGVhZGVyID0gbmV3IEhlYWRlcigpO1xyXG5cclxuICAgIGxldCBsb2dJbiA9IG5ldyBMb2dJbihzb3VyY2VfZGF0YSk7XHJcbiAgICBsb2dJbi5zZW5kX2lucHV0X3RleHQoaGVhZGVyKTtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vbigndXNlcl95ZWFyX3NldCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHNvdXJjZV9kYXRhKTtcclxuICAgICAgICBsZXQgcGFuZWwgPSBuZXcgUGFuZWwoc291cmNlX2RhdGEueWVhcik7XHJcbiAgICAgICAgcGFuZWwuZGF5cy5zZWxlY3RfaW50ZXJ2YWwoKTtcclxuICAgIFxyXG4gICAgICAgIGxldCBkaXNwbGF5SW50ZXJ2YWxzID0gbmV3IERpc3BsYXlJbnRlcnZhbHMoc291cmNlX2RhdGEudXNlciwgc291cmNlX2RhdGEueWVhciwgc291cmNlX2RhdGEpO1xyXG4gICAgICAgIHBhbmVsLmRheXMuc2F2ZV9pbnRlcnZhbChkaXNwbGF5SW50ZXJ2YWxzKTtcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbi8vIC0tLS0tLS0tLS0gbWFpbiAtLS0tLS0tLS0tLVxyXG5cclxuY2xhc3MgUGFuZWwge1xyXG4gICAgY29uc3RydWN0b3IoeWVhcikge1xyXG4gICAgICAgIHRoaXMueWVhciA9IHllYXI7XHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCcpO1xyXG4gICAgICAgIHRoaXMuanEucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm1vbnRoID0gbmV3IE1vbnRoKCk7XHJcbiAgICAgICAgdGhpcy5kYXlzID0gbmV3IERheXModGhpcy5tb250aC5tb250aCwgeWVhciwgc291cmNlX2RhdGEpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubW9udGguY2hhbmdlX21vbnRoKHRoaXMuZGF5cyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5tb250aC5jaGFuZ2VfbW9udGhfdXBfZG93bigpO1xyXG4gICAgICAgIFxyXG4gICAgfVxyXG59XHJcbiIsImxldCB1dGlscyA9IHJlcXVpcmUoJy4vVXRpbHMuanMnKTtcclxubGV0IGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZy9ob2xpZGF5Q29uZmlnLmpzJyk7XHJcblxyXG5jbGFzcyBEYXlzIHtcclxuICAgIGNvbnN0cnVjdG9yKG1vbnRoLCB5ZWFyLCBzb3VyY2VfZGF0YSkge1xyXG4gICAgICAgIHRoaXMuc291cmNlX2RhdGEgPSBzb3VyY2VfZGF0YTtcclxuXHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuY29sdW1ucyBkaXYuZGF5cycpO1xyXG5cclxuICAgICAgICB0aGlzLm1vbnRoID0gbW9udGg7XHJcbiAgICAgICAgdGhpcy55ZWFyID0geWVhcjtcclxuICAgICAgICB0aGlzLmRheXMgPSBbXTtcclxuICAgICAgICB0aGlzLmRheXNfbmFtZXMgPSBbJ00nLCAnVCcsICdXJywgJ1QnLCAnRicsICdTJywgJ1MnXTtcclxuICAgICAgICB0aGlzLnRvdGFsX2RheXMgPSAnJztcclxuICAgICAgICB0aGlzLmRheXNfc2VsZWN0ZWQgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0X2RheXMoKTtcclxuICAgICAgICB0aGlzLmNoYW5nZV9kYXlzKCk7XHJcbiAgICAgICAgdGhpcy5jbGVhcigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMudG90YWxEaXNwbGF5ID0gMDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdF9kYXlzKCkge1xyXG4gICAgICAgIHRoaXMudG90YWxfZGF5cyA9IG1vbWVudCh0aGlzLnllYXIgKyAnICcgKyB0aGlzLm1vbnRoLCBcIllZWVkgTU1NTVwiKS5kYXlzSW5Nb250aCgpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBkYXlfbnIgPSAxOyBkYXlfbnIgPD0gdGhpcy50b3RhbF9kYXlzOyBkYXlfbnIrKykge1xyXG4gICAgICAgICAgICBsZXQgZGF5ID0gdGhpcy5jcmVhdGVfbW9udGhfZGF5KGRheV9ucik7XHJcbiAgICAgICAgICAgIHRoaXMuanEuZmluZCgnZGl2LmNhbGVuZGFyJykuYXBwZW5kKGRheS5qcSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF5cy5wdXNoKGRheSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBmaXJzdF9kYXkgPSB0aGlzLmRheXNbMF0uZGF5X29mX3dlZWs7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNiAtIGZpcnN0X2RheTsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBmaWxsX2RheV9wcmVwcGVuZCA9IHRoaXMuY3JlYXRlX21vbnRoX2RheSgwLCAxKTtcclxuICAgICAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYuY2FsZW5kYXInKS5wcmVwZW5kKGZpbGxfZGF5X3ByZXBwZW5kLmpxKTtcclxuICAgICAgICAgICAgdGhpcy5kYXlzLnVuc2hpZnQoZmlsbF9kYXlfcHJlcHBlbmQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDY7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHRoaXMuanEuZmluZCgnZGl2LmNhbGVuZGFyJykucHJlcGVuZChgPHAgY2xhc3M9XCJkYXlzX25hbWVcIj4ke3RoaXMuZGF5c19uYW1lc1tpXX08L3A+YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZV9tb250aF9kYXkoZGF5X25yLCBmaWxsKSB7XHJcbiAgICAgICAgbGV0IGRheSA9IHtcclxuICAgICAgICAgICAgbnIgOiAnJyxcclxuICAgICAgICAgICAgZGF5X29mX3dlZWsgOiAnJyxcclxuICAgICAgICAgICAganEgOiAkKCc8cCBjbGFzcz1cImNsaWNrYWJsZVwiPjwvcD4nKSxcclxuICAgICAgICAgICAgdHlwZSA6ICcnXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRfZGF5KGRheSwgZGF5X25yLCBmaWxsKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGRheTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRfZGF5KGRheSwgZGF5X25yLCBmaWxsKSB7XHJcbiAgICAgICAgZGF5LmpxLnJlbW92ZUNsYXNzKCdmaWxsJyk7XHJcbiAgICAgICAgZGF5LmpxLnJlbW92ZUNsYXNzKCdzdGF0ZV9ob2xpZGF5Jyk7XHJcbiAgICAgICAgLy9kYXkuanEucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xyXG5cclxuICAgICAgICBkYXkuanEucmVtb3ZlQ2xhc3MoJ3dlZWtlbmQnKTtcclxuICAgICAgICBpZiAoZmlsbCkge1xyXG4gICAgICAgICAgICBkYXkubnIgPSBkYXlfbnI7XHJcbiAgICAgICAgICAgIGRheS5kYXlfb2Zfd2VlayA9IC0xO1xyXG4gICAgICAgICAgICAvL2RheS5qcS50ZXh0KCcnKTtcclxuICAgICAgICAgICAgdXRpbHMuY2hhbmdlX2NoYXJfbmljZShkYXkuanEsICcnKTtcclxuICAgICAgICAgICAgZGF5LnR5cGUgPSdmaWxsJztcclxuICAgICAgICAgICAgZGF5LmpxLmFkZENsYXNzKCdmaWxsJyk7XHJcbiAgICAgICAgICAgIGRheS5qcS5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZGF5Lm5yID0gZGF5X25yO1xyXG4gICAgICAgICAgICBkYXkuZGF5X29mX3dlZWsgPSAgbW9tZW50KHRoaXMueWVhciArICcgJyArIHRoaXMubW9udGggKyAnICcgKyBkYXlfbnIsIFwiWVlZWSBNTU1NIEREXCIpLmRheSgpO1xyXG4gICAgICAgICAgICAvL2RheS5qcS50ZXh0KGRheS5ucik7XHJcbiAgICAgICAgICAgIHV0aWxzLmNoYW5nZV9jaGFyX25pY2UoZGF5LmpxLCBkYXkubnIpO1xyXG4gICAgICAgICAgICBkYXkudHlwZSA9IGRheS5kYXlfb2Zfd2VlayA9PSAwIHx8IGRheS5kYXlfb2Zfd2VlayA9PSA2ID8gJ3dlZWtlbmQnIDogJ25vcm1hbCc7XHJcblxyXG4gICAgICAgICAgICBkYXkudHlwZSA9IGNvbmZpZ1t0aGlzLm1vbnRoXSAmJiBjb25maWdbdGhpcy5tb250aF0uZmlsdGVyKCh4KSA9PiB4ID09IGRheS5ucikubGVuZ3RoID8gJ3N0YXRlX2hvbGlkYXknIDogZGF5LnR5cGU7XHJcbiAgICAgICAgICAgIGlmIChkYXkudHlwZSA9PSAnd2Vla2VuZCcpIGRheS5qcS5hZGRDbGFzcygnd2Vla2VuZCcpO1xyXG4gICAgICAgICAgICBpZiAoZGF5LnR5cGUgPT0gJ3N0YXRlX2hvbGlkYXknKSBkYXkuanEuYWRkQ2xhc3MoJ3N0YXRlX2hvbGlkYXknKTtcclxuICAgICAgICAgICAgaWYgKGRheS50eXBlICE9ICdub3JtYWwnKSB7XHJcbiAgICAgICAgICAgICAgICBkYXkuanEucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGF5LmpxLmFkZENsYXNzKCdjbGlja2FibGUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgY2hhbmdlX2RheXMoKSB7XHJcbiAgICAgICAgdGhpcy5qcS5vbignbW9udGhfY2hhbmdlZCcsICQucHJveHkoZnVuY3Rpb24oZXZlbnQsIG1vbnRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xlYXJfc2VsZWN0KCk7XHJcbiAgICAgICAgICAgIHRoaXMubW9udGggPSBtb250aDtcclxuICAgICAgICAgICAgdGhpcy50b3RhbF9kYXlzID0gbW9tZW50KHRoaXMueWVhciArICcgJyArIHRoaXMubW9udGgsIFwiWVlZWSBNTU1NXCIpLmRheXNJbk1vbnRoKCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZmlyc3Rfd2Vla19kYXkgPSBtb21lbnQodGhpcy55ZWFyICsgJyAnICsgdGhpcy5tb250aCArICcgJyArIDEsIFwiWVlZWSBNTU1NIEREXCIpLmRheSgpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHRvdGFsX2Zvcl9sZW5naHQgPSB0aGlzLnRvdGFsX2RheXMgKyAoZmlyc3Rfd2Vla19kYXkgPT0gMCA/IDYgOiBmaXJzdF93ZWVrX2RheSAtIDEpO1xyXG4gICAgICAgICAgICB0b3RhbF9mb3JfbGVuZ2h0ID0gdG90YWxfZm9yX2xlbmdodCA+IHRoaXMuZGF5cy5sZW5ndGggPyB0b3RhbF9mb3JfbGVuZ2h0IDogdGhpcy5kYXlzLmxlbmd0aDtcclxuICAgICAgICAgICAgbGV0IGN1cnJlbnRfbW1vbnRoX2RheV9uciA9IDE7XHJcblxyXG4gICAgICAgICAgICBsZXQgdGltbWVyID0gMDtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbF9mb3JfbGVuZ2h0OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoJC5wcm94eShmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRheXNbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChmaXJzdF93ZWVrX2RheSA9PSAwICYmIGkgPCA2KSB8fCAoZmlyc3Rfd2Vla19kYXkgPiBpICsgMSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0X2RheSh0aGlzLmRheXNbaV0sIDAsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRfbW1vbnRoX2RheV9uciA8PSB0aGlzLnRvdGFsX2RheXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0X2RheSh0aGlzLmRheXNbaV0sIGN1cnJlbnRfbW1vbnRoX2RheV9ucik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50X21tb250aF9kYXlfbnIrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF5c1tpXS5qcS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF5c1tpXSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGRheSA9IHRoaXMuY3JlYXRlX21vbnRoX2RheShjdXJyZW50X21tb250aF9kYXlfbnIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5jYWxlbmRhcicpLmFwcGVuZChkYXkuanEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRheXMucHVzaChkYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50X21tb250aF9kYXlfbnIrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LCB0aGlzKSwgdGltbWVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aW1tZXIgKz0gMzA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoJC5wcm94eShmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuZGF5cyA9IHRoaXMuZGF5cy5maWx0ZXIoKHgpID0+IHgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcmVzZWxlY3QoKTtcclxuICAgICAgICAgICAgfSwgdGhpcyksIHRpbW1lciArIDEwMCk7XHJcblxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBzZWxlY3RfaW50ZXJ2YWwoKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYuY2FsZW5kYXInKS5vbignY2xpY2snLCAncCcsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgICBsZXQgZGF5ID0gJChldmVudC5jdXJyZW50VGFyZ2V0KTtcclxuICAgICAgICAgICAgbGV0IHRvdGFsRGlzcGxheSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYgZGl2Lm1vbnRoIGRpdi50b3RhbCBwJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGF5Lmhhc0NsYXNzKCdkYXlfc2VsZWN0ZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXlzX3NlbGVjdGVkID0gdGhpcy5kYXlzX3NlbGVjdGVkLnJlbW92ZShkYXkudGV4dCgpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudG90YWxEaXNwbGF5ID0gdGhpcy50b3RhbERpc3BsYXkgLSAxOyBcclxuICAgICAgICAgICAgICAgIHV0aWxzLmNoYW5nZV9jaGFyX25pY2UodG90YWxEaXNwbGF5LCB0aGlzLnRvdGFsRGlzcGxheSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZGF5LnJlbW92ZUNsYXNzKCdkYXlfc2VsZWN0ZWQnKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXkuYXR0cignY2xhc3MnKSA9PSAnY2xpY2thYmxlJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXlzX3NlbGVjdGVkLnB1c2goTnVtYmVyKGRheS50ZXh0KCkpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudG90YWxEaXNwbGF5ID0gdGhpcy50b3RhbERpc3BsYXkgKyAxO1xyXG4gICAgICAgICAgICAgICAgdXRpbHMuY2hhbmdlX2NoYXJfbmljZSh0b3RhbERpc3BsYXksIHRoaXMudG90YWxEaXNwbGF5KTtcclxuXHJcbiAgICAgICAgICAgICAgICBkYXkuYWRkQ2xhc3MoJ2RheV9zZWxlY3RlZCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG5cclxuICAgICAgICB0aGlzLnByZXNlbGVjdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByZXNlbGVjdCgpIHtcclxuICAgICAgICBpZih0aGlzLnNvdXJjZV9kYXRhLm1vbnRoc1t0aGlzLm1vbnRoXSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBkYXlfc2VsZWN0ZWQgb2YgdGhpcy5zb3VyY2VfZGF0YS5tb250aHNbdGhpcy5tb250aF0pIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGN1cnJlbnRfZGF5IG9mIHRoaXMuZGF5cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X2RheS5uciA9PSBkYXlfc2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudF9kYXkuanEudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyKCkge1xyXG4gICAgICAgICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuYWN0aW9ucyBkaXYuY2xlYXJfc2VsZWN0aW9uJykub24oJ2NsaWNrJywgJC5wcm94eShmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZmlyZWQnKTtcclxuICAgICAgICAgICAgdGhpcy5jbGVhcl9zZWxlY3QoKTtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuc291cmNlX2RhdGEubW9udGhzW3RoaXMubW9udGhdO1xyXG4gICAgICAgICAgICAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2LmRpc3BsYXkgdGFibGUnKS50cmlnZ2VyKCdyZW5kZXJJbnRlcnZhbHMnKTtcclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXJfc2VsZWN0KCkge1xyXG4gICAgICAgIGZvciAobGV0IGRheSBvZiB0aGlzLmRheXMpIHtcclxuICAgICAgICAgICAgZGF5LmpxLnJlbW92ZUNsYXNzKCdkYXlfc2VsZWN0ZWQnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kYXlzX3NlbGVjdGVkID0gW107XHJcbiAgICAgICAgdGhpcy50b3RhbERpc3BsYXkgPSAwXHJcbiAgICAgICAgdXRpbHMuY2hhbmdlX2NoYXJfbmljZSgkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2IGRpdi5tb250aCBkaXYudG90YWwgcCcpLCB0aGlzLnRvdGFsRGlzcGxheSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZV9pbnRlcnZhbChkaXNwbGF5KSB7XHJcblxyXG4gICAgICAgIHRoaXMuanEucGFyZW50KCkuZmluZCgnZGl2LmFjdGlvbnMgZGl2LnNhdmVfaW50ZXJ2YWwnKS5vbignY2xpY2snLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmRheXNfc2VsZWN0ZWQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZV9kYXRhLm1vbnRoc1t0aGlzLm1vbnRoXSA9IHRoaXMuZGF5c19zZWxlY3RlZDtcclxuICAgICAgICAgICAgICAgIGRpc3BsYXkudGFibGUudHJpZ2dlcigncmVuZGVySW50ZXJ2YWxzJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5zb3VyY2VfZGF0YSk7XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEYXlzO1xyXG4iLCJsZXQgdXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzLmpzJyk7XHJcblxyXG5jbGFzcyBEaXNwbGF5SW50ZXJ2YWxzIHtcclxuICAgIGNvbnN0cnVjdG9yKHVzZXIsIHllYXIsIHNvdXJjZV9kYXRhKSB7XHJcbiAgICAgICAgdGhpcy5zb3VyY2VfZGF0YSA9IHNvdXJjZV9kYXRhO1xyXG5cclxuICAgICAgICB0aGlzLmpxID0gJCgnZGl2Lm1haW4gZGl2LnBhbmVsIGRpdi5kaXNwbGF5Jyk7XHJcbiAgICAgICAgdGhpcy5qcS5yZW1vdmVDbGFzcygnaGlkZScpO1xyXG5cclxuICAgICAgICB0aGlzLnRhYmxlID0gdGhpcy5qcS5maW5kKCd0YWJsZScpO1xyXG4gICAgICAgIHRoaXMudXNlciA9IHVzZXI7XHJcbiAgICAgICAgdGhpcy55ZWFyID0geWVhcjtcclxuICAgICAgICAvL3RoaXMuc2F2ZV9kYXRhID0ge307XHJcblxyXG4gICAgICAgIHRoaXMudG9nZ2xlX3BhbmVsKCk7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJfaW50ZXJ2YWxzKCk7XHJcbiAgICAgICAgdGhpcy5zZXRfcGFuZWxfbW9udGgoKTtcclxuICAgICAgICB0aGlzLnNhdmVfaW50ZXJ2YWxzKCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHRvZ2dsZV9wYW5lbCgpIHtcclxuICAgICAgICB0aGlzLmpxLmZpbmQoJ3AudGl0bGUgc3BhbicpLm9uKCdjbGljaycsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgJCgnZGl2Lm1haW4gZGl2LnBhbmVsIGRpdi5jb2x1bW5zJykudG9nZ2xlQ2xhc3MoJ2hpZGUnKTtcclxuICAgICAgICAgICAgdGhpcy5qcS5maW5kKCdwLnNhdmVQVE8nKS50b2dnbGVDbGFzcygnaGlkZScpO1xyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXJfaW50ZXJ2YWxzKCkge1xyXG4gICAgICAgIHRoaXMudGFibGUub24oJ3JlbmRlckludGVydmFscycsICQucHJveHkoZnVuY3Rpb24oZXZlbnQsIGludGl0aWFsX3JlbmRlcil7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuc291cmNlX2RhdGEubW9udGhzKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudGFibGUuYWRkQ2xhc3MoJ2hpZGVfZm9yX3JlbmRlcicpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCQucHJveHkoZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLmZpbmQoJ3Rib2R5JykuaHRtbCgnJyk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBtb250aCBpbiB0aGlzLnNvdXJjZV9kYXRhLm1vbnRocykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCByb3cgPSAkKCc8dHI+PC90cj4nKTtcclxuICAgICAgICAgICAgICAgICAgICByb3cuYXBwZW5kKGA8dGQ+JHttb250aH08L3RkPmApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJvdy5hcHBlbmQoYDx0ZD4ke3RoaXMuc291cmNlX2RhdGEubW9udGhzW21vbnRoXS5qb2luKCcsJyl9PC90ZD5gKTtcclxuICAgICAgICAgICAgICAgICAgICByb3cuYXBwZW5kKGA8dGQ+JHt0aGlzLnNvdXJjZV9kYXRhLm1vbnRoc1ttb250aF0ubGVuZ3RoIH08L3RkPmApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLmZpbmQoJ3Rib2R5JykuYXBwZW5kKHJvdyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coT2JqZWN0LmtleXModGhpcy5zb3VyY2VfZGF0YS5tb250aHMpKTtcclxuICAgICAgICAgICAgICAgIHV0aWxzLmNoYW5nZV9jaGFyX25pY2UodGhpcy5qcS5maW5kKCdkaXYudG90YWxZZWFyIHAudG90YWwnKSwgT2JqZWN0LmtleXModGhpcy5zb3VyY2VfZGF0YS5tb250aHMpLnJlZHVjZShcclxuICAgICAgICAgICAgICAgICAgICAoc3VtLCB4KSA9PiBzdW0gKyB0aGlzLnNvdXJjZV9kYXRhLm1vbnRoc1t4XS5sZW5ndGhcclxuICAgICAgICAgICAgICAgICAgICAsIDApKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLnJlbW92ZUNsYXNzKCdoaWRlX2Zvcl9yZW5kZXInKTtcclxuICAgICAgICAgICAgICAgIGlmIChpbnRpdGlhbF9yZW5kZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLmZpbmQoJ3Rib2R5IHRyJykuZmlyc3QoKS50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCB0aGlzKSwgNjAwKTtcclxuXHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldF9wYW5lbF9tb250aCgpIHtcclxuICAgICAgICB0aGlzLnRhYmxlLm9uKCdjbGljaycsJ3Rib2R5IHRyJywgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhldmVudCk7XHJcbiAgICAgICAgICAgIGxldCBtb250aCA9ICQodGhpcykuZmluZCgndGQnKS5maXJzdCgpLnRleHQoKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cobW9udGgpO1xyXG4gICAgICAgICAgICAkKCdkaXYubW9udGhfaW5wdXQgcC5tb250aF90ZXh0JykudHJpZ2dlcignbW9udGhfY2hhbmdlZCcsIG1vbnRoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzYXZlX2ludGVydmFscygpIHtcclxuICAgICAgICAkKCdkaXYuYWN0aW9ucyBkaXYuc2F2ZVBUTycpLm9uKCdjbGljaycsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5zb3VyY2VfZGF0YSk7XHJcbiAgICAgICAgICAgICQucG9zdCggXCIvdXBkYXRlXCIsIHRoaXMuc291cmNlX2RhdGEsIGZ1bmN0aW9uKCBkYXRhICkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YS5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRGlzcGxheUludGVydmFsczsiLCJsZXQgdXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzLmpzJyk7XHJcblxyXG5jbGFzcyBIZWFkZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5oZWFkZXInKTtcclxuICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy5qcS5maW5kKCdzcGFuJykudGV4dCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldF91c2VyKHVzZXJfbmFtZSkge1xyXG4gICAgICAgIHRoaXMuanEuZmluZCgnZGl2LnVzZXInKS5jc3MoJ29wYWNpdHknLCAnMScpO1xyXG4gICAgICAgIHV0aWxzLnJhbmRvbV90ZXh0X2NoYW5nZSh0aGlzLmpxLmZpbmQoJ3AnKS5maXJzdCgpLCB1c2VyX25hbWUsIDEwMCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNldF95ZWFyKHllYXIpIHtcclxuXHJcbiAgICAgICAgaWYgKC8gLSBcXGR7NH0vLnRlc3QodGhpcy50aXRsZSkpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh5ZWFyKTtcclxuICAgICAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMudGl0bGUucmVwbGFjZSgvXFxkezR9LywgeWVhcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMudGl0bGUgKyAnIC0gJyArIHllYXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1dGlscy5yYW5kb21fdGV4dF9jaGFuZ2UodGhpcy5qcS5maW5kKCdzcGFuJykuZmlyc3QoKSwgdGhpcy50aXRsZSwgMTAwKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBIZWFkZXI7IiwibGV0IHV0aWxzID0gcmVxdWlyZSgnLi9VdGlscy5qcycpO1xyXG5cclxuY2xhc3MgTW9udGgge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuY29sdW1ucyBkaXYubW9udGgnKTtcclxuICAgICAgICB0aGlzLm1vbnRoID0gdGhpcy5qcS5maW5kKCdwLm1vbnRoX3RleHQnKS50ZXh0KCk7XHJcbiAgICAgICAgdGhpcy5tb250aHNfaW5feWVhciA9IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5JywgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddO1xyXG4gICAgfVxyXG5cclxuICAgIHNldF9tb250aChtb250aCkge1xyXG4gICAgICAgIHRoaXMubW9udGggPSBtb250aDtcclxuICAgICAgICB1dGlscy5yYW5kb21fdGV4dF9jaGFuZ2UodGhpcy5qcS5maW5kKCdwLm1vbnRoX3RleHQnKS5maXJzdCgpLG1vbnRoLCAxMDApO1xyXG4gICAgfVxyXG5cclxuICAgIGNoYW5nZV9tb250aF91cF9kb3duKCkge1xyXG4gICAgICAgIHRoaXMuanEuZmluZCgncC51cCxwLmRvd24nKS5vbignY2xpY2snLCAkLnByb3h5KGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubW9udGhzX2luX3llYXIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1vbnRoID09IHRoaXMubW9udGhzX2luX3llYXJbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dF9tb250aCA9ICh0aGlzLm1vbnRoc19pbl95ZWFyW2kgKyAxXSB8fCB0aGlzLm1vbnRoc19pbl95ZWFyWzBdKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcHJldmlvdXNfbW9udGggPSAodGhpcy5tb250aHNfaW5feWVhcltpIC0gMV0gfHwgdGhpcy5tb250aHNfaW5feWVhci5sYXN0KCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmhhc0NsYXNzKCd1cCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0X21vbnRoKG5leHRfbW9udGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0X21vbnRoKHByZXZpb3VzX21vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5qcS5maW5kKCdwLm1vbnRoX3RleHQnKS50cmlnZ2VyKCdtb250aF9jaGFuZ2VkJywgdGhpcy5tb250aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIGNoYW5nZV9tb250aChkYXlzKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdwLm1vbnRoX3RleHQnKS5vbignbW9udGhfY2hhbmdlZCcsICQucHJveHkoZnVuY3Rpb24gKGV2ZW50LCBtb250aCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldF9tb250aChtb250aCk7XHJcbiAgICAgICAgICAgIGRheXMuanEudHJpZ2dlcignbW9udGhfY2hhbmdlZCcsIHRoaXMubW9udGgpO1xyXG4gICAgICAgIH0sdGhpcykpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vbnRoOyIsIm1vZHVsZS5leHBvcnRzLnJhbmRvbV90ZXh0X2NoYW5nZSA9ICBmdW5jdGlvbiAoanFfb2JqLCB0ZXh0X25ldywgdGltbWVyKSB7XHJcblxyXG4gICAgbGV0IFssd2lkdGhdID0gLyhcXGQrKS8uZXhlYyhqcV9vYmouY3NzKCdmb250LXNpemUnKSk7XHJcblxyXG4gICAgbGV0IHJhbmRvbV9jaGFuZ2Vfc3R5bGUgPSAkKCc8c3R5bGUgdHlwZT1cInRleHQvY3NzXCI+PC9zdHlsZT4nKTtcclxuICAgIHJhbmRvbV9jaGFuZ2Vfc3R5bGUudGV4dChcclxuICAgICAgICAnLnJhbmRvbV9jaGFuZ2UgeyBkaXNwbGF5OmlubGluZS1ibG9jazsgbWluLXdpZHRoOiAwcHg7IHRyYW5zaXRpb246IGFsbCAnICsgdGltbWVyIC8gMTAwMCArICdzO30gJyArXHJcbiAgICAgICAgJy5yYW5kb21fY2hhbmdlX3NwYW5faGlkZSB7IG1pbi13aWR0aDogJyArIHdpZHRoLzIgKyAncHg7IG9wYWNpdHk6MDsgfSAnICtcclxuICAgICAgICAnLnJhbmRvbV9jaGFuZ2Vfc3Bhbl9yZW1vdmUgeyBtaW4td2lkdGg6ICcgKyB3aWR0aC8yICsgJ3B4OyBvcGFjaXR5OjA7IH0nXHJcbiAgICApO1xyXG4gICAgJCgnaGVhZCcpLnByZXBlbmQocmFuZG9tX2NoYW5nZV9zdHlsZSk7XHJcblxyXG4gICAgbGV0IGNoYXJzX25ldyA9IHRleHRfbmV3LnNwbGl0KCcnKTtcclxuICAgIGxldCBjaGFyc19vcmcgPSBqcV9vYmoudGV4dCgpLnNwbGl0KCcnKTtcclxuICAgIGxldCBtYXhfbnIgPSBjaGFyc19uZXcubGVuZ3RoID4gY2hhcnNfb3JnLmxlbmd0aCA/IGNoYXJzX25ldy5sZW5ndGggOiBjaGFyc19vcmcubGVuZ3RoO1xyXG5cclxuICAgIGpxX29iai50ZXh0KCcnKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4X25yOyBpKyspIHtcclxuICAgICAgICBpZiAoY2hhcnNfb3JnW2ldKSB7XHJcbiAgICAgICAgICAgIGNoYXJzX29yZ1tpXSA9ICQoYDxzcGFuIGNsYXNzPSdyYW5kb21fY2hhbmdlJz4ke2NoYXJzX29yZ1tpXX08L3NwYW4+YCk7XHJcbiAgICAgICAgICAgIGNoYXJzX29yZ1tpXTtcclxuICAgICAgICAgICAgaWYgKGNoYXJzX29yZ1tpXS50ZXh0KCkgPT0gJyAnKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFyc19vcmdbaV0uY3NzKCdtaW4td2lkdGgnLCB3aWR0aC8zLTEgKyAncHgnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjaGFyc19vcmdbaV0gPSAkKGA8c3BhbiBjbGFzcz0ncmFuZG9tX2NoYW5nZSc+PC9zcGFuPmApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAganFfb2JqLmFwcGVuZChjaGFyc19vcmdbaV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBjb3VudGVyID0gWy4uLkFycmF5KG1heF9ucikua2V5cygpXTtcclxuXHJcbiAgICBjb3VudGVyLnNodWZmbGUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaSA9IHRoaXMubGVuZ3RoLCBqLCB0ZW1wO1xyXG4gICAgICAgIGlmICggaSA9PSAwICkgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgd2hpbGUgKCAtLWkgKSB7XHJcbiAgICAgICAgICAgIGogPSBNYXRoLmZsb29yKCBNYXRoLnJhbmRvbSgpICogKCBpICsgMSApICk7XHJcbiAgICAgICAgICAgIHRlbXAgPSB0aGlzW2ldO1xyXG4gICAgICAgICAgICB0aGlzW2ldID0gdGhpc1tqXTtcclxuICAgICAgICAgICAgdGhpc1tqXSA9IHRlbXA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBjb3VudGVyID0gY291bnRlci5zaHVmZmxlKCk7XHJcbiAgICBsZXQgaW5pdGlhbF90aW1lID0gdGltbWVyO1xyXG4gICAgZm9yIChsZXQgaW5kZXggb2YgY291bnRlcikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgY2hhcnNfb3JnW2luZGV4XSAhPSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgY2hhcnNfbmV3W2luZGV4XSAhPSAndW5kZWZpbmVkJykge1xyXG5cclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0uYWRkQ2xhc3MoJ3JhbmRvbV9jaGFuZ2Vfc3Bhbl9oaWRlJyk7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFyc19uZXdbaW5kZXhdID09ICcgJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFyc19vcmdbaW5kZXhdLmNzcygnd2lkdGgnLCAnOHB4Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0udGV4dChjaGFyc19uZXdbaW5kZXhdKTtcclxuICAgICAgICAgICAgICAgICAgICBjaGFyc19vcmdbaW5kZXhdLnJlbW92ZUNsYXNzKCdyYW5kb21fY2hhbmdlX3NwYW5faGlkZScpO1xyXG4gICAgICAgICAgICAgICAgfSxpbml0aWFsX3RpbWUpXHJcblxyXG4gICAgICAgICAgICB9LCB0aW1tZXIpO1xyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjaGFyc19uZXdbaW5kZXhdID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFyc19vcmdbaW5kZXhdLmFkZENsYXNzKCdyYW5kb21fY2hhbmdlX3NwYW5fcmVtb3ZlJyk7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhcnNfb3JnW2luZGV4XS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIH0sIGluaXRpYWxfdGltZSk7XHJcbiAgICAgICAgICAgIH0sIHRpbW1lcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aW1tZXIgKz0gaW5pdGlhbF90aW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAganFfb2JqLmh0bWwoanFfb2JqLnRleHQoKSk7XHJcbiAgICAgICAgcmFuZG9tX2NoYW5nZV9zdHlsZS5yZW1vdmUoKTtcclxuXHJcbiAgICB9LCBpbml0aWFsX3RpbWUgKyB0aW1tZXIpO1xyXG5cclxufVxyXG5cclxubGV0IHF1ZV9zaW5nbGVfY2hhciA9IFtdO1xyXG5tb2R1bGUuZXhwb3J0cy5jaGFuZ2VfY2hhcl9uaWNlID0gZnVuY3Rpb24oanFfb2JqLCBuZXdfdGV4dCkge1xyXG4gICAgcXVlX3NpbmdsZV9jaGFyLnB1c2gobmV3X3RleHQpO1xyXG4gICAganFfb2JqLnJlbW92ZUNsYXNzKCdzaW5nbGVfY2hhcl9jaGFuZ2UnKTtcclxuICAgIGpxX29iai5hZGRDbGFzcygnc2luZ2xlX2NoYXJfY2hhbmdlJyk7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAganFfb2JqLnRleHQocXVlX3NpbmdsZV9jaGFyLnNoaWZ0KCkpO1xyXG4gICAgfSwgMjUwKTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBqcV9vYmoucmVtb3ZlQ2xhc3MoJ3NpbmdsZV9jaGFyX2NoYW5nZScpO1xyXG4gICAgfSwgNjAwKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuZ2V0X3VybF9wYXJhbXMgPSBmdW5jdGlvbihwYXJhbSkge1xyXG4gICAgbGV0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xyXG5cclxuICAgIGxldCByZXN1bHQgPSBuZXcgUmVnRXhwKCdbXFw/Jl0nICsgcGFyYW0gKyAnPShbXiYjXSopJykuZXhlYyh3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcbiAgICByZXN1bHQgPSByZXN1bHQmJnJlc3VsdFsxXTtcclxuICAgIGlmKCFyZXN1bHQpIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKCcvJyk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuYW5pbWF0ZV93cm9uZyA9IGZ1bmN0aW9uKGpxX29iaikge1xyXG4gICAganFfb2JqLmFkZENsYXNzKCd3cm9uZ192YWwnKTtcclxuICAgIGxldCBhbmltYXRpb25fdGltZSA9IE51bWJlcigvKFtcXGRcXC5dKykvLmV4ZWMoanFfb2JqLmNzcygnYW5pbWF0aW9uJykpWzFdKTtcclxuICAgIHNldFRpbWVvdXQoJC5wcm94eShmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKCd3cm9uZ192YWwnKTtcclxuICAgIH0sIGpxX29iaiksIGFuaW1hdGlvbl90aW1lICogMTAwMClcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuc2VuZEpzb24gPSBmdW5jdGlvbih1cmwsIGpzb24pIHtcclxuICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGpzb24pLFxyXG4gICAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLTgnLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihtc2cpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUobXNnKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgcmVqZWN0KEVycm9yKGVycikpO1xyXG4gICAgICAgIH0pO1xyXG4gICB9KTtcclxufSIsImxldCB1dGlscyA9IHJlcXVpcmUoJy4vVXRpbHMuanMnKTtcclxuXHJcbmNsYXNzIExvZ0luIHtcclxuICAgIGNvbnN0cnVjdG9yKHNvdXJjZV9kYXRhKSB7XHJcbiAgICAgICAgdGhpcy5zb3VyY2VfZGF0YSA9IHNvdXJjZV9kYXRhO1xyXG4gICAgICAgIHRoaXMuanEgPSAkKCdkaXYubG9nX2luJyk7XHJcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gJ0xvZyBpbiB3aXRoIGVtYWlsJztcclxuICAgICAgICB0aGlzLnVzZXIgPSAnJztcclxuICAgIH1cclxuXHJcbiAgICBzZXRfbWVzc2FqZShtZXNzYWplKSB7XHJcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FqZTtcclxuICAgICAgICB1dGlscy5yYW5kb21fdGV4dF9jaGFuZ2UodGhpcy5qcS5maW5kKCdwJykuZmlyc3QoKSwgbWVzc2FqZSwgMTAwKTtcclxuICAgIH1cclxuXHJcbiAgICBzZW5kX2lucHV0X3RleHQoaGVhZGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuanEuZmluZCgnaW5wdXQnKS5vbigna2V5cHJlc3MnLCAkLnByb3h5KCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5ID09ICdFbnRlcicgJiYgIXRoaXMudXNlcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VyID0gJChldmVudC5jdXJyZW50VGFyZ2V0KS52YWwoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBoZWFkZXIuc2V0X3VzZXIodGhpcy51c2VyKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc291cmNlX2RhdGEudXNlciA9IHRoaXMudXNlcjtcclxuICAgICAgICAgICAgICAgIGhlYWRlci5qcS5maW5kKCdkaXYudXNlcicpLnJlbW92ZUNsYXNzKCdoaWRlJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRfbWVzc2FqZSgnUGxlYXNlIGNob29zZSB5ZWFyJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2lucHV0JykudmFsKCcnKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5rZXkgPT0gJ0VudGVyJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy55ZWFyID0gJChldmVudC5jdXJyZW50VGFyZ2V0KS52YWwoKTtcclxuICAgICAgICAgICAgICAgIGlmICgvXlxcZHs0fSQvLnRlc3QodGhpcy55ZWFyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlci5zZXRfeWVhcih0aGlzLnllYXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuanEuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5zb3VyY2VfZGF0YS55ZWFyID0gdGhpcy55ZWFyO1xyXG5cclxuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ3VzZXJfeWVhcl9zZXQnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkLmdldCggXCIvY2hlY2tfZGF0YVwiLCB7dXNlciA6IHRoaXMudXNlciwgeWVhcjogdGhpcy55ZWFyfSwgJC5wcm94eShmdW5jdGlvbiggZGF0YSApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnNvdXJjZV9kYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZV9kYXRhLm1vbnRocyA9IGRhdGEucmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICQoJ2Rpdi5kaXNwbGF5IHRhYmxlJykudHJpZ2dlcigncmVuZGVySW50ZXJ2YWxzJywgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8kKCdkaXYuZGlzcGxheSB0YWJsZSB0Ym9keSB0cicpLmZpcnN0KCkudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgICAgIH0sIHRoaXMpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb2dJbjsiXX0=
