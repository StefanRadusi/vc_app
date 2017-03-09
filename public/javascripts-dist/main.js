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
let utils = require('./main_modules/Utils.js');
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
    let user = utils.get_url_params('user');
    source_data.user = user;

    let header = new Header();

    let panel = new Panel(user);
    source_data.year = panel.year;

    let logIn = new LogIn(panel);
    logIn.send_input_text(header);

    let displayIntervals = new DisplayIntervals(source_data.user, source_data.year, source_data);
    panel.days.save_interval(displayIntervals);


    if(user) {
        logIn.jq.hide();
        panel.jq.removeClass('hide');

        header.jq.find('div.user').removeClass('hide');
        header.set_user(user);
    } 
   
});

// ---------- main -----------

class Panel {
    constructor(user) {
        this.user = user;
        this.year = this.getYear();


        console.log(this.year);
        this.jq = $('div.main div.panel');
        // this.jq.removeClass('hide');
        
        this.month = new Month();
        this.days = new Days(this.month.month, this.year, source_data);
        this.days.select_interval();
        
        this.month.change_month(this.days);
        this.month.change_month_up_down();

        this.onChangeYear();
        this.getSourceData().then((data) => {  
            source_data.months = data;
            console.log(source_data);
            setTimeout(() => {
                // this.days.preselect();
                $('div.display table').trigger('renderIntervals', data);
            }, 1000);
            

        })
    }

    getYear() {
        return Number(/(\d+)/.exec($('div.year h2').text())[1]);
    }

    onChangeYear() {
        $('div.year p').on('click', $.proxy(function(event){
            console.log('change year');
            let direction = /^up/.test($(event.currentTarget).attr('class')) ? 1 : -1;
            this.year = this.year + direction;
            console.log(this.year);
            source_data.year = this.year;
            source_data.months = {};

            this.days.setYear(this.year);
            utils.random_text_change($('div.year h2'), 'Year: ' + this.year, 100);

            this.getSourceData().then((data) => {  
                if (data) {
                    source_data.months = data;
                    $('div.display table').trigger('renderIntervals', data);
                }
            })
        }, this));
    }

    getSourceData() {
        return new Promise($.proxy(function(resolve, reject){
            $.get( "/check_data", {user : this.user, year: this.year}, function( data ) {
                console.log(data.response);
                resolve(data.response);
            });
        }, this));
    }

}

},{"./config/holidayConfig.js":1,"./main_modules/Days.js":3,"./main_modules/DisplayIntervals.js":4,"./main_modules/Header.js":5,"./main_modules/Month.js":6,"./main_modules/Utils.js":7,"./main_modules/logIn.js":8}],3:[function(require,module,exports){
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

    setYear(year) {
        this.year = year;
        this.jq.trigger('month_changed', this.month);
    }

    init_days() {
        this.total_days = moment(this.year + ' ' + this.month, "YYYY MMMM").daysInMonth();

        for (let day_nr = 1; day_nr <= this.total_days; day_nr++) {
            let day = this.create_month_day(day_nr);
            this.jq.find('div.calendar').append(day.jq);
            this.days.push(day);
        }

        let first_day = this.days[0].day_of_week || 7;
        for (let i = 0; i < first_day - 1; i++) {
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
            }, this), timmer + 200);

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

        // this.preselect();
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
    // if(!result) window.location.replace('/');

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
            }
            // } else if (event.key == 'Enter') {
            //     this.year = $(event.currentTarget).val();
            //     if (/^\d{4}$/.test(this.year)) {
            //         header.set_year(this.year);
            //         this.jq.hide();
            //     }
            //     this.source_data.year = this.year;

            //     $(document).trigger('user_year_set');

            //     $.get( "/check_data", {user : this.user, year: this.year}, $.proxy(function( data ) {
            //         console.log(this.source_data);
            //         this.source_data.months = data.response;

            //         $('div.display table').trigger('renderIntervals', 1);
            //         //$('div.display table tbody tr').first().trigger('click');
            //     }, this));
            // }
        }, this));
    }
}

module.exports = LogIn;
},{"./Utils.js":7}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkY6XFxub2RlanNcXG5ld19leHByZXNzXFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL2NvbmZpZy9ob2xpZGF5Q29uZmlnLmpzIiwiRjovbm9kZWpzL25ld19leHByZXNzL3B1YmxpYy9qYXZhc2NyaXB0cy9mYWtlXzY0MTJjMjdiLmpzIiwiRjovbm9kZWpzL25ld19leHByZXNzL3B1YmxpYy9qYXZhc2NyaXB0cy9tYWluX21vZHVsZXMvRGF5cy5qcyIsIkY6L25vZGVqcy9uZXdfZXhwcmVzcy9wdWJsaWMvamF2YXNjcmlwdHMvbWFpbl9tb2R1bGVzL0Rpc3BsYXlJbnRlcnZhbHMuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL21haW5fbW9kdWxlcy9IZWFkZXIuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL21haW5fbW9kdWxlcy9Nb250aC5qcyIsIkY6L25vZGVqcy9uZXdfZXhwcmVzcy9wdWJsaWMvamF2YXNjcmlwdHMvbWFpbl9tb2R1bGVzL1V0aWxzLmpzIiwiRjovbm9kZWpzL25ld19leHByZXNzL3B1YmxpYy9qYXZhc2NyaXB0cy9tYWluX21vZHVsZXMvbG9nSW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImxldCBjb25maWcgPSB7XHJcbiAgc3VhIDoge1xyXG4gICAgXCJKYW51YXJ5XCIgOiBbMl0sXHJcbiAgICBcIk1heVwiIDogWzI5XSxcclxuICAgIFwiSnVseVwiIDogWzRdLFxyXG4gICAgXCJTZXB0ZW1iZXJcIiA6IFs0XSxcclxuICAgIFwiTm92ZW1iZXJcIiA6IFsyMywyNF0sXHJcbiAgICBcIkRlY2VtYmVyXCIgOiBbMjVdXHJcbiAgfSxcclxuICByb20gOiB7XHJcbiAgICBcIkphbnVhcnlcIiA6IFsxLDIsMjRdLFxyXG4gICAgXCJBcHJpbFwiIDogWzE2LDE3XSxcclxuICAgIFwiTWF5XCIgOiBbMV0sXHJcbiAgICBcIkp1bmVcIiA6IFsxLDQsNV0sXHJcbiAgICBcIkF1Z3VzdFwiIDogWzE1XSxcclxuICAgIFwiTm92ZW1iZXJcIiA6IFszMF0sXHJcbiAgICBcIkRlY2VtYmVyXCIgOiBbMSwgMjUsIDI2XVxyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBjb25maWcucm9tOyIsImxldCB1dGlscyA9IHJlcXVpcmUoJy4vbWFpbl9tb2R1bGVzL1V0aWxzLmpzJyk7XHJcbmxldCBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZy9ob2xpZGF5Q29uZmlnLmpzJyk7XHJcbmxldCBMb2dJbiA9IHJlcXVpcmUoJy4vbWFpbl9tb2R1bGVzL2xvZ0luLmpzJyk7XHJcbmxldCBIZWFkZXIgPSByZXF1aXJlKCcuL21haW5fbW9kdWxlcy9IZWFkZXIuanMnKTtcclxubGV0IE1vbnRoID0gcmVxdWlyZSgnLi9tYWluX21vZHVsZXMvTW9udGguanMnKTtcclxubGV0IERheXMgPSByZXF1aXJlKCcuL21haW5fbW9kdWxlcy9EYXlzLmpzJyk7XHJcbmxldCBEaXNwbGF5SW50ZXJ2YWxzID0gcmVxdWlyZSgnLi9tYWluX21vZHVsZXMvRGlzcGxheUludGVydmFscy5qcycpO1xyXG5cclxubGV0IHNvdXJjZV9kYXRhID0ge1xyXG4gICAgdXNlciA6ICcnLFxyXG4gICAgeWVhcjogJycsXHJcbiAgICBtb250aHM6IHt9XHJcbn07XHJcblxyXG5pZiAoIUFycmF5LnByb3RvdHlwZS5sYXN0KXtcclxuICAgIEFycmF5LnByb3RvdHlwZS5sYXN0ID0gZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gdGhpc1t0aGlzLmxlbmd0aCAtIDFdO1xyXG4gICAgfTtcclxufVxyXG5cclxuaWYgKCFBcnJheS5wcm90b3R5cGUucmVtb3ZlKXtcclxuICAgIEFycmF5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihyZW1vdmVkX2VsZW1lbnQpe1xyXG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBlbGVtZW50IG9mIHRoaXMpIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1lbnQgIT0gcmVtb3ZlZF9lbGVtZW50KSByZXN1bHQucHVzaChlbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH07XHJcbn1cclxuXHJcbi8vIC0tLS0tLS0tLS0gbWFpbiAtLS0tLS0tLS0tLVxyXG5cclxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XHJcbiAgICBsZXQgdXNlciA9IHV0aWxzLmdldF91cmxfcGFyYW1zKCd1c2VyJyk7XHJcbiAgICBzb3VyY2VfZGF0YS51c2VyID0gdXNlcjtcclxuXHJcbiAgICBsZXQgaGVhZGVyID0gbmV3IEhlYWRlcigpO1xyXG5cclxuICAgIGxldCBwYW5lbCA9IG5ldyBQYW5lbCh1c2VyKTtcclxuICAgIHNvdXJjZV9kYXRhLnllYXIgPSBwYW5lbC55ZWFyO1xyXG5cclxuICAgIGxldCBsb2dJbiA9IG5ldyBMb2dJbihwYW5lbCk7XHJcbiAgICBsb2dJbi5zZW5kX2lucHV0X3RleHQoaGVhZGVyKTtcclxuXHJcbiAgICBsZXQgZGlzcGxheUludGVydmFscyA9IG5ldyBEaXNwbGF5SW50ZXJ2YWxzKHNvdXJjZV9kYXRhLnVzZXIsIHNvdXJjZV9kYXRhLnllYXIsIHNvdXJjZV9kYXRhKTtcclxuICAgIHBhbmVsLmRheXMuc2F2ZV9pbnRlcnZhbChkaXNwbGF5SW50ZXJ2YWxzKTtcclxuXHJcblxyXG4gICAgaWYodXNlcikge1xyXG4gICAgICAgIGxvZ0luLmpxLmhpZGUoKTtcclxuICAgICAgICBwYW5lbC5qcS5yZW1vdmVDbGFzcygnaGlkZScpO1xyXG5cclxuICAgICAgICBoZWFkZXIuanEuZmluZCgnZGl2LnVzZXInKS5yZW1vdmVDbGFzcygnaGlkZScpO1xyXG4gICAgICAgIGhlYWRlci5zZXRfdXNlcih1c2VyKTtcclxuICAgIH0gXHJcbiAgIFxyXG59KTtcclxuXHJcbi8vIC0tLS0tLS0tLS0gbWFpbiAtLS0tLS0tLS0tLVxyXG5cclxuY2xhc3MgUGFuZWwge1xyXG4gICAgY29uc3RydWN0b3IodXNlcikge1xyXG4gICAgICAgIHRoaXMudXNlciA9IHVzZXI7XHJcbiAgICAgICAgdGhpcy55ZWFyID0gdGhpcy5nZXRZZWFyKCk7XHJcblxyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnllYXIpO1xyXG4gICAgICAgIHRoaXMuanEgPSAkKCdkaXYubWFpbiBkaXYucGFuZWwnKTtcclxuICAgICAgICAvLyB0aGlzLmpxLnJlbW92ZUNsYXNzKCdoaWRlJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5tb250aCA9IG5ldyBNb250aCgpO1xyXG4gICAgICAgIHRoaXMuZGF5cyA9IG5ldyBEYXlzKHRoaXMubW9udGgubW9udGgsIHRoaXMueWVhciwgc291cmNlX2RhdGEpO1xyXG4gICAgICAgIHRoaXMuZGF5cy5zZWxlY3RfaW50ZXJ2YWwoKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm1vbnRoLmNoYW5nZV9tb250aCh0aGlzLmRheXMpO1xyXG4gICAgICAgIHRoaXMubW9udGguY2hhbmdlX21vbnRoX3VwX2Rvd24oKTtcclxuXHJcbiAgICAgICAgdGhpcy5vbkNoYW5nZVllYXIoKTtcclxuICAgICAgICB0aGlzLmdldFNvdXJjZURhdGEoKS50aGVuKChkYXRhKSA9PiB7ICBcclxuICAgICAgICAgICAgc291cmNlX2RhdGEubW9udGhzID0gZGF0YTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coc291cmNlX2RhdGEpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuZGF5cy5wcmVzZWxlY3QoKTtcclxuICAgICAgICAgICAgICAgICQoJ2Rpdi5kaXNwbGF5IHRhYmxlJykudHJpZ2dlcigncmVuZGVySW50ZXJ2YWxzJywgZGF0YSk7XHJcbiAgICAgICAgICAgIH0sIDEwMDApO1xyXG4gICAgICAgICAgICBcclxuXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBnZXRZZWFyKCkge1xyXG4gICAgICAgIHJldHVybiBOdW1iZXIoLyhcXGQrKS8uZXhlYygkKCdkaXYueWVhciBoMicpLnRleHQoKSlbMV0pO1xyXG4gICAgfVxyXG5cclxuICAgIG9uQ2hhbmdlWWVhcigpIHtcclxuICAgICAgICAkKCdkaXYueWVhciBwJykub24oJ2NsaWNrJywgJC5wcm94eShmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjaGFuZ2UgeWVhcicpO1xyXG4gICAgICAgICAgICBsZXQgZGlyZWN0aW9uID0gL151cC8udGVzdCgkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmF0dHIoJ2NsYXNzJykpID8gMSA6IC0xO1xyXG4gICAgICAgICAgICB0aGlzLnllYXIgPSB0aGlzLnllYXIgKyBkaXJlY3Rpb247XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMueWVhcik7XHJcbiAgICAgICAgICAgIHNvdXJjZV9kYXRhLnllYXIgPSB0aGlzLnllYXI7XHJcbiAgICAgICAgICAgIHNvdXJjZV9kYXRhLm1vbnRocyA9IHt9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5kYXlzLnNldFllYXIodGhpcy55ZWFyKTtcclxuICAgICAgICAgICAgdXRpbHMucmFuZG9tX3RleHRfY2hhbmdlKCQoJ2Rpdi55ZWFyIGgyJyksICdZZWFyOiAnICsgdGhpcy55ZWFyLCAxMDApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5nZXRTb3VyY2VEYXRhKCkudGhlbigoZGF0YSkgPT4geyAgXHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZV9kYXRhLm1vbnRocyA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnZGl2LmRpc3BsYXkgdGFibGUnKS50cmlnZ2VyKCdyZW5kZXJJbnRlcnZhbHMnLCBkYXRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0U291cmNlRGF0YSgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoJC5wcm94eShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xyXG4gICAgICAgICAgICAkLmdldCggXCIvY2hlY2tfZGF0YVwiLCB7dXNlciA6IHRoaXMudXNlciwgeWVhcjogdGhpcy55ZWFyfSwgZnVuY3Rpb24oIGRhdGEgKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhLnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YS5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuXHJcbn1cclxuIiwibGV0IHV0aWxzID0gcmVxdWlyZSgnLi9VdGlscy5qcycpO1xyXG5sZXQgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnL2hvbGlkYXlDb25maWcuanMnKTtcclxuXHJcbmNsYXNzIERheXMge1xyXG4gICAgY29uc3RydWN0b3IobW9udGgsIHllYXIsIHNvdXJjZV9kYXRhKSB7XHJcbiAgICAgICAgdGhpcy5zb3VyY2VfZGF0YSA9IHNvdXJjZV9kYXRhO1xyXG5cclxuICAgICAgICB0aGlzLmpxID0gJCgnZGl2Lm1haW4gZGl2LnBhbmVsIGRpdi5jb2x1bW5zIGRpdi5kYXlzJyk7XHJcblxyXG4gICAgICAgIHRoaXMubW9udGggPSBtb250aDtcclxuICAgICAgICB0aGlzLnllYXIgPSB5ZWFyO1xyXG4gICAgICAgIHRoaXMuZGF5cyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZGF5c19uYW1lcyA9IFsnTScsICdUJywgJ1cnLCAnVCcsICdGJywgJ1MnLCAnUyddO1xyXG4gICAgICAgIHRoaXMudG90YWxfZGF5cyA9ICcnO1xyXG4gICAgICAgIHRoaXMuZGF5c19zZWxlY3RlZCA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmluaXRfZGF5cygpO1xyXG4gICAgICAgIHRoaXMuY2hhbmdlX2RheXMoKTtcclxuICAgICAgICB0aGlzLmNsZWFyKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy50b3RhbERpc3BsYXkgPSAwO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZXRZZWFyKHllYXIpIHtcclxuICAgICAgICB0aGlzLnllYXIgPSB5ZWFyO1xyXG4gICAgICAgIHRoaXMuanEudHJpZ2dlcignbW9udGhfY2hhbmdlZCcsIHRoaXMubW9udGgpO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXRfZGF5cygpIHtcclxuICAgICAgICB0aGlzLnRvdGFsX2RheXMgPSBtb21lbnQodGhpcy55ZWFyICsgJyAnICsgdGhpcy5tb250aCwgXCJZWVlZIE1NTU1cIikuZGF5c0luTW9udGgoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgZGF5X25yID0gMTsgZGF5X25yIDw9IHRoaXMudG90YWxfZGF5czsgZGF5X25yKyspIHtcclxuICAgICAgICAgICAgbGV0IGRheSA9IHRoaXMuY3JlYXRlX21vbnRoX2RheShkYXlfbnIpO1xyXG4gICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5jYWxlbmRhcicpLmFwcGVuZChkYXkuanEpO1xyXG4gICAgICAgICAgICB0aGlzLmRheXMucHVzaChkYXkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGZpcnN0X2RheSA9IHRoaXMuZGF5c1swXS5kYXlfb2Zfd2VlayB8fCA3O1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlyc3RfZGF5IC0gMTsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBmaWxsX2RheV9wcmVwcGVuZCA9IHRoaXMuY3JlYXRlX21vbnRoX2RheSgwLCAxKTtcclxuICAgICAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYuY2FsZW5kYXInKS5wcmVwZW5kKGZpbGxfZGF5X3ByZXBwZW5kLmpxKTtcclxuICAgICAgICAgICAgdGhpcy5kYXlzLnVuc2hpZnQoZmlsbF9kYXlfcHJlcHBlbmQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDY7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHRoaXMuanEuZmluZCgnZGl2LmNhbGVuZGFyJykucHJlcGVuZChgPHAgY2xhc3M9XCJkYXlzX25hbWVcIj4ke3RoaXMuZGF5c19uYW1lc1tpXX08L3A+YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZV9tb250aF9kYXkoZGF5X25yLCBmaWxsKSB7XHJcbiAgICAgICAgbGV0IGRheSA9IHtcclxuICAgICAgICAgICAgbnIgOiAnJyxcclxuICAgICAgICAgICAgZGF5X29mX3dlZWsgOiAnJyxcclxuICAgICAgICAgICAganEgOiAkKCc8cCBjbGFzcz1cImNsaWNrYWJsZVwiPjwvcD4nKSxcclxuICAgICAgICAgICAgdHlwZSA6ICcnXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRfZGF5KGRheSwgZGF5X25yLCBmaWxsKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGRheTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRfZGF5KGRheSwgZGF5X25yLCBmaWxsKSB7XHJcbiAgICAgICAgZGF5LmpxLnJlbW92ZUNsYXNzKCdmaWxsJyk7XHJcbiAgICAgICAgZGF5LmpxLnJlbW92ZUNsYXNzKCdzdGF0ZV9ob2xpZGF5Jyk7XHJcbiAgICAgICAgLy9kYXkuanEucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xyXG5cclxuICAgICAgICBkYXkuanEucmVtb3ZlQ2xhc3MoJ3dlZWtlbmQnKTtcclxuICAgICAgICBpZiAoZmlsbCkge1xyXG4gICAgICAgICAgICBkYXkubnIgPSBkYXlfbnI7XHJcbiAgICAgICAgICAgIGRheS5kYXlfb2Zfd2VlayA9IC0xO1xyXG4gICAgICAgICAgICAvL2RheS5qcS50ZXh0KCcnKTtcclxuICAgICAgICAgICAgdXRpbHMuY2hhbmdlX2NoYXJfbmljZShkYXkuanEsICcnKTtcclxuICAgICAgICAgICAgZGF5LnR5cGUgPSdmaWxsJztcclxuICAgICAgICAgICAgZGF5LmpxLmFkZENsYXNzKCdmaWxsJyk7XHJcbiAgICAgICAgICAgIGRheS5qcS5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZGF5Lm5yID0gZGF5X25yO1xyXG4gICAgICAgICAgICBkYXkuZGF5X29mX3dlZWsgPSAgbW9tZW50KHRoaXMueWVhciArICcgJyArIHRoaXMubW9udGggKyAnICcgKyBkYXlfbnIsIFwiWVlZWSBNTU1NIEREXCIpLmRheSgpO1xyXG4gICAgICAgICAgICAvL2RheS5qcS50ZXh0KGRheS5ucik7XHJcbiAgICAgICAgICAgIHV0aWxzLmNoYW5nZV9jaGFyX25pY2UoZGF5LmpxLCBkYXkubnIpO1xyXG4gICAgICAgICAgICBkYXkudHlwZSA9IGRheS5kYXlfb2Zfd2VlayA9PSAwIHx8IGRheS5kYXlfb2Zfd2VlayA9PSA2ID8gJ3dlZWtlbmQnIDogJ25vcm1hbCc7XHJcblxyXG4gICAgICAgICAgICBkYXkudHlwZSA9IGNvbmZpZ1t0aGlzLm1vbnRoXSAmJiBjb25maWdbdGhpcy5tb250aF0uZmlsdGVyKCh4KSA9PiB4ID09IGRheS5ucikubGVuZ3RoID8gJ3N0YXRlX2hvbGlkYXknIDogZGF5LnR5cGU7XHJcbiAgICAgICAgICAgIGlmIChkYXkudHlwZSA9PSAnd2Vla2VuZCcpIGRheS5qcS5hZGRDbGFzcygnd2Vla2VuZCcpO1xyXG4gICAgICAgICAgICBpZiAoZGF5LnR5cGUgPT0gJ3N0YXRlX2hvbGlkYXknKSBkYXkuanEuYWRkQ2xhc3MoJ3N0YXRlX2hvbGlkYXknKTtcclxuICAgICAgICAgICAgaWYgKGRheS50eXBlICE9ICdub3JtYWwnKSB7XHJcbiAgICAgICAgICAgICAgICBkYXkuanEucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGF5LmpxLmFkZENsYXNzKCdjbGlja2FibGUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgY2hhbmdlX2RheXMoKSB7XHJcbiAgICAgICAgdGhpcy5qcS5vbignbW9udGhfY2hhbmdlZCcsICQucHJveHkoZnVuY3Rpb24oZXZlbnQsIG1vbnRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xlYXJfc2VsZWN0KCk7XHJcbiAgICAgICAgICAgIHRoaXMubW9udGggPSBtb250aDtcclxuICAgICAgICAgICAgdGhpcy50b3RhbF9kYXlzID0gbW9tZW50KHRoaXMueWVhciArICcgJyArIHRoaXMubW9udGgsIFwiWVlZWSBNTU1NXCIpLmRheXNJbk1vbnRoKCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZmlyc3Rfd2Vla19kYXkgPSBtb21lbnQodGhpcy55ZWFyICsgJyAnICsgdGhpcy5tb250aCArICcgJyArIDEsIFwiWVlZWSBNTU1NIEREXCIpLmRheSgpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHRvdGFsX2Zvcl9sZW5naHQgPSB0aGlzLnRvdGFsX2RheXMgKyAoZmlyc3Rfd2Vla19kYXkgPT0gMCA/IDYgOiBmaXJzdF93ZWVrX2RheSAtIDEpO1xyXG4gICAgICAgICAgICB0b3RhbF9mb3JfbGVuZ2h0ID0gdG90YWxfZm9yX2xlbmdodCA+IHRoaXMuZGF5cy5sZW5ndGggPyB0b3RhbF9mb3JfbGVuZ2h0IDogdGhpcy5kYXlzLmxlbmd0aDtcclxuICAgICAgICAgICAgbGV0IGN1cnJlbnRfbW1vbnRoX2RheV9uciA9IDE7XHJcblxyXG4gICAgICAgICAgICBsZXQgdGltbWVyID0gMDtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbF9mb3JfbGVuZ2h0OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoJC5wcm94eShmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRheXNbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChmaXJzdF93ZWVrX2RheSA9PSAwICYmIGkgPCA2KSB8fCAoZmlyc3Rfd2Vla19kYXkgPiBpICsgMSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0X2RheSh0aGlzLmRheXNbaV0sIDAsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRfbW1vbnRoX2RheV9uciA8PSB0aGlzLnRvdGFsX2RheXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0X2RheSh0aGlzLmRheXNbaV0sIGN1cnJlbnRfbW1vbnRoX2RheV9ucik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50X21tb250aF9kYXlfbnIrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF5c1tpXS5qcS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF5c1tpXSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGRheSA9IHRoaXMuY3JlYXRlX21vbnRoX2RheShjdXJyZW50X21tb250aF9kYXlfbnIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5jYWxlbmRhcicpLmFwcGVuZChkYXkuanEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRheXMucHVzaChkYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50X21tb250aF9kYXlfbnIrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LCB0aGlzKSwgdGltbWVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aW1tZXIgKz0gMzA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoJC5wcm94eShmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXlzID0gdGhpcy5kYXlzLmZpbHRlcigoeCkgPT4geCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByZXNlbGVjdCgpO1xyXG4gICAgICAgICAgICB9LCB0aGlzKSwgdGltbWVyICsgMjAwKTtcclxuXHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHNlbGVjdF9pbnRlcnZhbCgpIHtcclxuICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5jYWxlbmRhcicpLm9uKCdjbGljaycsICdwJywgJC5wcm94eShmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICAgIGxldCBkYXkgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xyXG4gICAgICAgICAgICBsZXQgdG90YWxEaXNwbGF5ID0gJCgnZGl2Lm1haW4gZGl2LnBhbmVsIGRpdiBkaXYubW9udGggZGl2LnRvdGFsIHAnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXkuaGFzQ2xhc3MoJ2RheV9zZWxlY3RlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRheXNfc2VsZWN0ZWQgPSB0aGlzLmRheXNfc2VsZWN0ZWQucmVtb3ZlKGRheS50ZXh0KCkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50b3RhbERpc3BsYXkgPSB0aGlzLnRvdGFsRGlzcGxheSAtIDE7IFxyXG4gICAgICAgICAgICAgICAgdXRpbHMuY2hhbmdlX2NoYXJfbmljZSh0b3RhbERpc3BsYXksIHRoaXMudG90YWxEaXNwbGF5KTtcclxuXHJcbiAgICAgICAgICAgICAgICBkYXkucmVtb3ZlQ2xhc3MoJ2RheV9zZWxlY3RlZCcpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRheS5hdHRyKCdjbGFzcycpID09ICdjbGlja2FibGUnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRheXNfc2VsZWN0ZWQucHVzaChOdW1iZXIoZGF5LnRleHQoKSkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50b3RhbERpc3BsYXkgPSB0aGlzLnRvdGFsRGlzcGxheSArIDE7XHJcbiAgICAgICAgICAgICAgICB1dGlscy5jaGFuZ2VfY2hhcl9uaWNlKHRvdGFsRGlzcGxheSwgdGhpcy50b3RhbERpc3BsYXkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGRheS5hZGRDbGFzcygnZGF5X3NlbGVjdGVkJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzKSk7XHJcblxyXG4gICAgICAgIC8vIHRoaXMucHJlc2VsZWN0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJlc2VsZWN0KCkge1xyXG4gICAgICAgIGlmKHRoaXMuc291cmNlX2RhdGEubW9udGhzW3RoaXMubW9udGhdKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGRheV9zZWxlY3RlZCBvZiB0aGlzLnNvdXJjZV9kYXRhLm1vbnRoc1t0aGlzLm1vbnRoXSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgY3VycmVudF9kYXkgb2YgdGhpcy5kYXlzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfZGF5Lm5yID09IGRheV9zZWxlY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50X2RheS5qcS50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXIoKSB7XHJcbiAgICAgICAgJCgnZGl2Lm1haW4gZGl2LnBhbmVsIGRpdi5hY3Rpb25zIGRpdi5jbGVhcl9zZWxlY3Rpb24nKS5vbignY2xpY2snLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmaXJlZCcpO1xyXG4gICAgICAgICAgICB0aGlzLmNsZWFyX3NlbGVjdCgpO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zb3VyY2VfZGF0YS5tb250aHNbdGhpcy5tb250aF07XHJcbiAgICAgICAgICAgICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuZGlzcGxheSB0YWJsZScpLnRyaWdnZXIoJ3JlbmRlckludGVydmFscycpO1xyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhcl9zZWxlY3QoKSB7XHJcbiAgICAgICAgZm9yIChsZXQgZGF5IG9mIHRoaXMuZGF5cykge1xyXG4gICAgICAgICAgICBkYXkuanEucmVtb3ZlQ2xhc3MoJ2RheV9zZWxlY3RlZCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRheXNfc2VsZWN0ZWQgPSBbXTtcclxuICAgICAgICB0aGlzLnRvdGFsRGlzcGxheSA9IDBcclxuICAgICAgICB1dGlscy5jaGFuZ2VfY2hhcl9uaWNlKCQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYgZGl2Lm1vbnRoIGRpdi50b3RhbCBwJyksIHRoaXMudG90YWxEaXNwbGF5KTtcclxuICAgIH1cclxuXHJcbiAgICBzYXZlX2ludGVydmFsKGRpc3BsYXkpIHtcclxuXHJcbiAgICAgICAgdGhpcy5qcS5wYXJlbnQoKS5maW5kKCdkaXYuYWN0aW9ucyBkaXYuc2F2ZV9pbnRlcnZhbCcpLm9uKCdjbGljaycsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGF5c19zZWxlY3RlZC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc291cmNlX2RhdGEubW9udGhzW3RoaXMubW9udGhdID0gdGhpcy5kYXlzX3NlbGVjdGVkO1xyXG4gICAgICAgICAgICAgICAgZGlzcGxheS50YWJsZS50cmlnZ2VyKCdyZW5kZXJJbnRlcnZhbHMnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnNvdXJjZV9kYXRhKTtcclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERheXM7XHJcbiIsImxldCB1dGlscyA9IHJlcXVpcmUoJy4vVXRpbHMuanMnKTtcclxuXHJcbmNsYXNzIERpc3BsYXlJbnRlcnZhbHMge1xyXG4gICAgY29uc3RydWN0b3IodXNlciwgeWVhciwgc291cmNlX2RhdGEpIHtcclxuICAgICAgICB0aGlzLnNvdXJjZV9kYXRhID0gc291cmNlX2RhdGE7XHJcblxyXG4gICAgICAgIHRoaXMuanEgPSAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2LmRpc3BsYXknKTtcclxuICAgICAgICB0aGlzLmpxLnJlbW92ZUNsYXNzKCdoaWRlJyk7XHJcblxyXG4gICAgICAgIHRoaXMudGFibGUgPSB0aGlzLmpxLmZpbmQoJ3RhYmxlJyk7XHJcbiAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcclxuICAgICAgICB0aGlzLnllYXIgPSB5ZWFyO1xyXG4gICAgICAgIC8vdGhpcy5zYXZlX2RhdGEgPSB7fTtcclxuXHJcbiAgICAgICAgdGhpcy50b2dnbGVfcGFuZWwoKTtcclxuICAgICAgICB0aGlzLnJlbmRlcl9pbnRlcnZhbHMoKTtcclxuICAgICAgICB0aGlzLnNldF9wYW5lbF9tb250aCgpO1xyXG4gICAgICAgIHRoaXMuc2F2ZV9pbnRlcnZhbHMoKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgdG9nZ2xlX3BhbmVsKCkge1xyXG4gICAgICAgIHRoaXMuanEuZmluZCgncC50aXRsZSBzcGFuJykub24oJ2NsaWNrJywgJC5wcm94eShmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2LmNvbHVtbnMnKS50b2dnbGVDbGFzcygnaGlkZScpO1xyXG4gICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ3Auc2F2ZVBUTycpLnRvZ2dsZUNsYXNzKCdoaWRlJyk7XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcl9pbnRlcnZhbHMoKSB7XHJcbiAgICAgICAgdGhpcy50YWJsZS5vbigncmVuZGVySW50ZXJ2YWxzJywgJC5wcm94eShmdW5jdGlvbihldmVudCwgaW50aXRpYWxfcmVuZGVyKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5zb3VyY2VfZGF0YS5tb250aHMpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy50YWJsZS5hZGRDbGFzcygnaGlkZV9mb3JfcmVuZGVyJyk7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoJC5wcm94eShmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMudGFibGUuZmluZCgndGJvZHknKS5odG1sKCcnKTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IG1vbnRoIGluIHRoaXMuc291cmNlX2RhdGEubW9udGhzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJvdyA9ICQoJzx0cj48L3RyPicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJvdy5hcHBlbmQoYDx0ZD4ke21vbnRofTwvdGQ+YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcm93LmFwcGVuZChgPHRkPiR7dGhpcy5zb3VyY2VfZGF0YS5tb250aHNbbW9udGhdLmpvaW4oJywnKX08L3RkPmApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJvdy5hcHBlbmQoYDx0ZD4ke3RoaXMuc291cmNlX2RhdGEubW9udGhzW21vbnRoXS5sZW5ndGggfTwvdGQ+YCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGFibGUuZmluZCgndGJvZHknKS5hcHBlbmQocm93KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhPYmplY3Qua2V5cyh0aGlzLnNvdXJjZV9kYXRhLm1vbnRocykpO1xyXG4gICAgICAgICAgICAgICAgdXRpbHMuY2hhbmdlX2NoYXJfbmljZSh0aGlzLmpxLmZpbmQoJ2Rpdi50b3RhbFllYXIgcC50b3RhbCcpLCBPYmplY3Qua2V5cyh0aGlzLnNvdXJjZV9kYXRhLm1vbnRocykucmVkdWNlKFxyXG4gICAgICAgICAgICAgICAgICAgIChzdW0sIHgpID0+IHN1bSArIHRoaXMuc291cmNlX2RhdGEubW9udGhzW3hdLmxlbmd0aFxyXG4gICAgICAgICAgICAgICAgICAgICwgMCkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMudGFibGUucmVtb3ZlQ2xhc3MoJ2hpZGVfZm9yX3JlbmRlcicpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGludGl0aWFsX3JlbmRlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGFibGUuZmluZCgndGJvZHkgdHInKS5maXJzdCgpLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIHRoaXMpLCA2MDApO1xyXG5cclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0X3BhbmVsX21vbnRoKCkge1xyXG4gICAgICAgIHRoaXMudGFibGUub24oJ2NsaWNrJywndGJvZHkgdHInLCBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGV2ZW50KTtcclxuICAgICAgICAgICAgbGV0IG1vbnRoID0gJCh0aGlzKS5maW5kKCd0ZCcpLmZpcnN0KCkudGV4dCgpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtb250aCk7XHJcbiAgICAgICAgICAgICQoJ2Rpdi5tb250aF9pbnB1dCBwLm1vbnRoX3RleHQnKS50cmlnZ2VyKCdtb250aF9jaGFuZ2VkJywgbW9udGgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmVfaW50ZXJ2YWxzKCkge1xyXG4gICAgICAgICQoJ2Rpdi5hY3Rpb25zIGRpdi5zYXZlUFRPJykub24oJ2NsaWNrJywgJC5wcm94eShmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnNvdXJjZV9kYXRhKTtcclxuICAgICAgICAgICAgJC5wb3N0KCBcIi91cGRhdGVcIiwgdGhpcy5zb3VyY2VfZGF0YSwgZnVuY3Rpb24oIGRhdGEgKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhLnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEaXNwbGF5SW50ZXJ2YWxzOyIsImxldCB1dGlscyA9IHJlcXVpcmUoJy4vVXRpbHMuanMnKTtcclxuXHJcbmNsYXNzIEhlYWRlciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmpxID0gJCgnZGl2LmhlYWRlcicpO1xyXG4gICAgICAgIHRoaXMudGl0bGUgPSB0aGlzLmpxLmZpbmQoJ3NwYW4nKS50ZXh0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0X3VzZXIodXNlcl9uYW1lKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYudXNlcicpLmNzcygnb3BhY2l0eScsICcxJyk7XHJcbiAgICAgICAgdXRpbHMucmFuZG9tX3RleHRfY2hhbmdlKHRoaXMuanEuZmluZCgncCcpLmZpcnN0KCksIHVzZXJfbmFtZSwgMTAwKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2V0X3llYXIoeWVhcikge1xyXG5cclxuICAgICAgICBpZiAoLyAtIFxcZHs0fS8udGVzdCh0aGlzLnRpdGxlKSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHllYXIpO1xyXG4gICAgICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy50aXRsZS5yZXBsYWNlKC9cXGR7NH0vLCB5ZWFyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy50aXRsZSArICcgLSAnICsgeWVhcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHV0aWxzLnJhbmRvbV90ZXh0X2NoYW5nZSh0aGlzLmpxLmZpbmQoJ3NwYW4nKS5maXJzdCgpLCB0aGlzLnRpdGxlLCAxMDApO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEhlYWRlcjsiLCJsZXQgdXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzLmpzJyk7XHJcblxyXG5jbGFzcyBNb250aCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmpxID0gJCgnZGl2Lm1haW4gZGl2LnBhbmVsIGRpdi5jb2x1bW5zIGRpdi5tb250aCcpO1xyXG4gICAgICAgIHRoaXMubW9udGggPSB0aGlzLmpxLmZpbmQoJ3AubW9udGhfdGV4dCcpLnRleHQoKTtcclxuICAgICAgICB0aGlzLm1vbnRoc19pbl95ZWFyID0gWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknLCAnQXVndXN0JywgJ1NlcHRlbWJlcicsICdPY3RvYmVyJywgJ05vdmVtYmVyJywgJ0RlY2VtYmVyJ107XHJcbiAgICB9XHJcblxyXG4gICAgc2V0X21vbnRoKG1vbnRoKSB7XHJcbiAgICAgICAgdGhpcy5tb250aCA9IG1vbnRoO1xyXG4gICAgICAgIHV0aWxzLnJhbmRvbV90ZXh0X2NoYW5nZSh0aGlzLmpxLmZpbmQoJ3AubW9udGhfdGV4dCcpLmZpcnN0KCksbW9udGgsIDEwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgY2hhbmdlX21vbnRoX3VwX2Rvd24oKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdwLnVwLHAuZG93bicpLm9uKCdjbGljaycsICQucHJveHkoZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5tb250aHNfaW5feWVhci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW9udGggPT0gdGhpcy5tb250aHNfaW5feWVhcltpXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXh0X21vbnRoID0gKHRoaXMubW9udGhzX2luX3llYXJbaSArIDFdIHx8IHRoaXMubW9udGhzX2luX3llYXJbMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwcmV2aW91c19tb250aCA9ICh0aGlzLm1vbnRoc19pbl95ZWFyW2kgLSAxXSB8fCB0aGlzLm1vbnRoc19pbl95ZWFyLmxhc3QoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQoZXZlbnQuY3VycmVudFRhcmdldCkuaGFzQ2xhc3MoJ3VwJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRfbW9udGgobmV4dF9tb250aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRfbW9udGgocHJldmlvdXNfbW9udGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ3AubW9udGhfdGV4dCcpLnRyaWdnZXIoJ21vbnRoX2NoYW5nZWQnLCB0aGlzLm1vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2hhbmdlX21vbnRoKGRheXMpIHtcclxuICAgICAgICB0aGlzLmpxLmZpbmQoJ3AubW9udGhfdGV4dCcpLm9uKCdtb250aF9jaGFuZ2VkJywgJC5wcm94eShmdW5jdGlvbiAoZXZlbnQsIG1vbnRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0X21vbnRoKG1vbnRoKTtcclxuICAgICAgICAgICAgZGF5cy5qcS50cmlnZ2VyKCdtb250aF9jaGFuZ2VkJywgdGhpcy5tb250aCk7XHJcbiAgICAgICAgfSx0aGlzKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9udGg7IiwibW9kdWxlLmV4cG9ydHMucmFuZG9tX3RleHRfY2hhbmdlID0gIGZ1bmN0aW9uIChqcV9vYmosIHRleHRfbmV3LCB0aW1tZXIpIHtcclxuXHJcbiAgICBsZXQgWyx3aWR0aF0gPSAvKFxcZCspLy5leGVjKGpxX29iai5jc3MoJ2ZvbnQtc2l6ZScpKTtcclxuXHJcbiAgICBsZXQgcmFuZG9tX2NoYW5nZV9zdHlsZSA9ICQoJzxzdHlsZSB0eXBlPVwidGV4dC9jc3NcIj48L3N0eWxlPicpO1xyXG4gICAgcmFuZG9tX2NoYW5nZV9zdHlsZS50ZXh0KFxyXG4gICAgICAgICcucmFuZG9tX2NoYW5nZSB7IGRpc3BsYXk6aW5saW5lLWJsb2NrOyBtaW4td2lkdGg6IDBweDsgdHJhbnNpdGlvbjogYWxsICcgKyB0aW1tZXIgLyAxMDAwICsgJ3M7fSAnICtcclxuICAgICAgICAnLnJhbmRvbV9jaGFuZ2Vfc3Bhbl9oaWRlIHsgbWluLXdpZHRoOiAnICsgd2lkdGgvMiArICdweDsgb3BhY2l0eTowOyB9ICcgK1xyXG4gICAgICAgICcucmFuZG9tX2NoYW5nZV9zcGFuX3JlbW92ZSB7IG1pbi13aWR0aDogJyArIHdpZHRoLzIgKyAncHg7IG9wYWNpdHk6MDsgfSdcclxuICAgICk7XHJcbiAgICAkKCdoZWFkJykucHJlcGVuZChyYW5kb21fY2hhbmdlX3N0eWxlKTtcclxuXHJcbiAgICBsZXQgY2hhcnNfbmV3ID0gdGV4dF9uZXcuc3BsaXQoJycpO1xyXG4gICAgbGV0IGNoYXJzX29yZyA9IGpxX29iai50ZXh0KCkuc3BsaXQoJycpO1xyXG4gICAgbGV0IG1heF9uciA9IGNoYXJzX25ldy5sZW5ndGggPiBjaGFyc19vcmcubGVuZ3RoID8gY2hhcnNfbmV3Lmxlbmd0aCA6IGNoYXJzX29yZy5sZW5ndGg7XHJcblxyXG4gICAganFfb2JqLnRleHQoJycpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXhfbnI7IGkrKykge1xyXG4gICAgICAgIGlmIChjaGFyc19vcmdbaV0pIHtcclxuICAgICAgICAgICAgY2hhcnNfb3JnW2ldID0gJChgPHNwYW4gY2xhc3M9J3JhbmRvbV9jaGFuZ2UnPiR7Y2hhcnNfb3JnW2ldfTwvc3Bhbj5gKTtcclxuICAgICAgICAgICAgY2hhcnNfb3JnW2ldO1xyXG4gICAgICAgICAgICBpZiAoY2hhcnNfb3JnW2ldLnRleHQoKSA9PSAnICcpIHtcclxuICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpXS5jc3MoJ21pbi13aWR0aCcsIHdpZHRoLzMtMSArICdweCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNoYXJzX29yZ1tpXSA9ICQoYDxzcGFuIGNsYXNzPSdyYW5kb21fY2hhbmdlJz48L3NwYW4+YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBqcV9vYmouYXBwZW5kKGNoYXJzX29yZ1tpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNvdW50ZXIgPSBbLi4uQXJyYXkobWF4X25yKS5rZXlzKCldO1xyXG5cclxuICAgIGNvdW50ZXIuc2h1ZmZsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpID0gdGhpcy5sZW5ndGgsIGosIHRlbXA7XHJcbiAgICAgICAgaWYgKCBpID09IDAgKSByZXR1cm4gdGhpcztcclxuICAgICAgICB3aGlsZSAoIC0taSApIHtcclxuICAgICAgICAgICAgaiA9IE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiAoIGkgKyAxICkgKTtcclxuICAgICAgICAgICAgdGVtcCA9IHRoaXNbaV07XHJcbiAgICAgICAgICAgIHRoaXNbaV0gPSB0aGlzW2pdO1xyXG4gICAgICAgICAgICB0aGlzW2pdID0gdGVtcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGNvdW50ZXIgPSBjb3VudGVyLnNodWZmbGUoKTtcclxuICAgIGxldCBpbml0aWFsX3RpbWUgPSB0aW1tZXI7XHJcbiAgICBmb3IgKGxldCBpbmRleCBvZiBjb3VudGVyKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjaGFyc19vcmdbaW5kZXhdICE9ICd1bmRlZmluZWQnICYmIHR5cGVvZiBjaGFyc19uZXdbaW5kZXhdICE9ICd1bmRlZmluZWQnKSB7XHJcblxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhcnNfb3JnW2luZGV4XS5hZGRDbGFzcygncmFuZG9tX2NoYW5nZV9zcGFuX2hpZGUnKTtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYXJzX25ld1tpbmRleF0gPT0gJyAnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0uY3NzKCd3aWR0aCcsICc4cHgnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhcnNfb3JnW2luZGV4XS50ZXh0KGNoYXJzX25ld1tpbmRleF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0ucmVtb3ZlQ2xhc3MoJ3JhbmRvbV9jaGFuZ2Vfc3Bhbl9oaWRlJyk7XHJcbiAgICAgICAgICAgICAgICB9LGluaXRpYWxfdGltZSlcclxuXHJcbiAgICAgICAgICAgIH0sIHRpbW1lcik7XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNoYXJzX25ld1tpbmRleF0gPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0uYWRkQ2xhc3MoJ3JhbmRvbV9jaGFuZ2Vfc3Bhbl9yZW1vdmUnKTtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICBjaGFyc19vcmdbaW5kZXhdLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSwgaW5pdGlhbF90aW1lKTtcclxuICAgICAgICAgICAgfSwgdGltbWVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRpbW1lciArPSBpbml0aWFsX3RpbWU7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICBqcV9vYmouaHRtbChqcV9vYmoudGV4dCgpKTtcclxuICAgICAgICByYW5kb21fY2hhbmdlX3N0eWxlLnJlbW92ZSgpO1xyXG5cclxuICAgIH0sIGluaXRpYWxfdGltZSArIHRpbW1lcik7XHJcblxyXG59XHJcblxyXG5sZXQgcXVlX3NpbmdsZV9jaGFyID0gW107XHJcbm1vZHVsZS5leHBvcnRzLmNoYW5nZV9jaGFyX25pY2UgPSBmdW5jdGlvbihqcV9vYmosIG5ld190ZXh0KSB7XHJcbiAgICBxdWVfc2luZ2xlX2NoYXIucHVzaChuZXdfdGV4dCk7XHJcbiAgICBqcV9vYmoucmVtb3ZlQ2xhc3MoJ3NpbmdsZV9jaGFyX2NoYW5nZScpO1xyXG4gICAganFfb2JqLmFkZENsYXNzKCdzaW5nbGVfY2hhcl9jaGFuZ2UnKTtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICBqcV9vYmoudGV4dChxdWVfc2luZ2xlX2NoYXIuc2hpZnQoKSk7XHJcbiAgICB9LCAyNTApO1xyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGpxX29iai5yZW1vdmVDbGFzcygnc2luZ2xlX2NoYXJfY2hhbmdlJyk7XHJcbiAgICB9LCA2MDApO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5nZXRfdXJsX3BhcmFtcyA9IGZ1bmN0aW9uKHBhcmFtKSB7XHJcbiAgICBsZXQgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcblxyXG4gICAgbGV0IHJlc3VsdCA9IG5ldyBSZWdFeHAoJ1tcXD8mXScgKyBwYXJhbSArICc9KFteJiNdKiknKS5leGVjKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcclxuICAgIHJlc3VsdCA9IHJlc3VsdCYmcmVzdWx0WzFdO1xyXG4gICAgLy8gaWYoIXJlc3VsdCkgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UoJy8nKTtcclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5hbmltYXRlX3dyb25nID0gZnVuY3Rpb24oanFfb2JqKSB7XHJcbiAgICBqcV9vYmouYWRkQ2xhc3MoJ3dyb25nX3ZhbCcpO1xyXG4gICAgbGV0IGFuaW1hdGlvbl90aW1lID0gTnVtYmVyKC8oW1xcZFxcLl0rKS8uZXhlYyhqcV9vYmouY3NzKCdhbmltYXRpb24nKSlbMV0pO1xyXG4gICAgc2V0VGltZW91dCgkLnByb3h5KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMucmVtb3ZlQ2xhc3MoJ3dyb25nX3ZhbCcpO1xyXG4gICAgfSwganFfb2JqKSwgYW5pbWF0aW9uX3RpbWUgKiAxMDAwKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5zZW5kSnNvbiA9IGZ1bmN0aW9uKHVybCwganNvbikge1xyXG4gICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoanNvbiksXHJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKG1zZykge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShtc2cpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICByZWplY3QoRXJyb3IoZXJyKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgIH0pO1xyXG59IiwibGV0IHV0aWxzID0gcmVxdWlyZSgnLi9VdGlscy5qcycpO1xyXG5cclxuY2xhc3MgTG9nSW4ge1xyXG4gICAgY29uc3RydWN0b3Ioc291cmNlX2RhdGEpIHtcclxuICAgICAgICB0aGlzLnNvdXJjZV9kYXRhID0gc291cmNlX2RhdGE7XHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5sb2dfaW4nKTtcclxuICAgICAgICB0aGlzLm1lc3NhZ2UgPSAnTG9nIGluIHdpdGggZW1haWwnO1xyXG4gICAgICAgIHRoaXMudXNlciA9ICcnO1xyXG4gICAgfVxyXG5cclxuICAgIHNldF9tZXNzYWplKG1lc3NhamUpIHtcclxuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWplO1xyXG4gICAgICAgIHV0aWxzLnJhbmRvbV90ZXh0X2NoYW5nZSh0aGlzLmpxLmZpbmQoJ3AnKS5maXJzdCgpLCBtZXNzYWplLCAxMDApO1xyXG4gICAgfVxyXG5cclxuICAgIHNlbmRfaW5wdXRfdGV4dChoZWFkZXIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5qcS5maW5kKCdpbnB1dCcpLm9uKCdrZXlwcmVzcycsICQucHJveHkoIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC5rZXkgPT0gJ0VudGVyJyAmJiAhdGhpcy51c2VyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXIgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLnZhbCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGhlYWRlci5zZXRfdXNlcih0aGlzLnVzZXIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zb3VyY2VfZGF0YS51c2VyID0gdGhpcy51c2VyO1xyXG4gICAgICAgICAgICAgICAgaGVhZGVyLmpxLmZpbmQoJ2Rpdi51c2VyJykucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldF9tZXNzYWplKCdQbGVhc2UgY2hvb3NlIHllYXInKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuanEuZmluZCgnaW5wdXQnKS52YWwoJycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIH0gZWxzZSBpZiAoZXZlbnQua2V5ID09ICdFbnRlcicpIHtcclxuICAgICAgICAgICAgLy8gICAgIHRoaXMueWVhciA9ICQoZXZlbnQuY3VycmVudFRhcmdldCkudmFsKCk7XHJcbiAgICAgICAgICAgIC8vICAgICBpZiAoL15cXGR7NH0kLy50ZXN0KHRoaXMueWVhcikpIHtcclxuICAgICAgICAgICAgLy8gICAgICAgICBoZWFkZXIuc2V0X3llYXIodGhpcy55ZWFyKTtcclxuICAgICAgICAgICAgLy8gICAgICAgICB0aGlzLmpxLmhpZGUoKTtcclxuICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgLy8gICAgIHRoaXMuc291cmNlX2RhdGEueWVhciA9IHRoaXMueWVhcjtcclxuXHJcbiAgICAgICAgICAgIC8vICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCd1c2VyX3llYXJfc2V0Jyk7XHJcblxyXG4gICAgICAgICAgICAvLyAgICAgJC5nZXQoIFwiL2NoZWNrX2RhdGFcIiwge3VzZXIgOiB0aGlzLnVzZXIsIHllYXI6IHRoaXMueWVhcn0sICQucHJveHkoZnVuY3Rpb24oIGRhdGEgKSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgY29uc29sZS5sb2codGhpcy5zb3VyY2VfZGF0YSk7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgdGhpcy5zb3VyY2VfZGF0YS5tb250aHMgPSBkYXRhLnJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgLy8gICAgICAgICAkKCdkaXYuZGlzcGxheSB0YWJsZScpLnRyaWdnZXIoJ3JlbmRlckludGVydmFscycsIDEpO1xyXG4gICAgICAgICAgICAvLyAgICAgICAgIC8vJCgnZGl2LmRpc3BsYXkgdGFibGUgdGJvZHkgdHInKS5maXJzdCgpLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICAgICAgICAgIC8vICAgICB9LCB0aGlzKSk7XHJcbiAgICAgICAgICAgIC8vIH1cclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTG9nSW47Il19
