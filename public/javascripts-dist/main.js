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
    let logIn = new LogIn();
    let user = utils.get_url_params('user');

    if (!user) return 1;

    source_data.user = user;
    let header = new Header();

    let panel = new Panel(user);
    source_data.year = panel.year;

    let displayIntervals = new DisplayIntervals(source_data.user, source_data.year, source_data);
    panel.days.save_interval(displayIntervals);

    logIn.jq.hide();
    panel.jq.removeClass('hide');

    header.jq.find('div.user').removeClass('hide');
    header.set_user(user);
   
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
                this.days.preselect();
                $('div.display table').trigger('renderIntervals');
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
                }
                $('div.display table').trigger('renderIntervals');
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
        this.today =  {
            day : Number(moment().format('DD')),
            month : Number(moment().format('MM')),
            year : Number(moment().format('YYYY')),
        }
        console.log(this.today);

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
        day.jq.removeClass('weekend');
        day.jq.removeClass('day_passed');

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

            let month = Number(moment(this.month, 'MMMM').format('MM'));
            if(this.year == this.today.year) {
                if (this.today.month == month) {
                    if(this.today.day > day_nr) {
                        day.jq.addClass('day_passed');
                    }
                } else if (this.today.month > month) {
                    day.jq.addClass('day_passed');
                }
            } else if (this.year < this.today.year) {
                day.jq.addClass('day_passed');
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
            console.log('in');
            if (day.hasClass('day_selected')) {
                this.days_selected = this.days_selected.remove(day.text());
                this.totalDisplay = this.totalDisplay - 1; 
                utils.change_char_nice(totalDisplay, this.totalDisplay);

                day.removeClass('day_selected');
            } else if (/clickable/.test(day.attr('class'))) {
                this.days_selected.push(Number(day.text()));
                this.totalDisplay = this.totalDisplay + 1;
                utils.change_char_nice(totalDisplay, this.totalDisplay);

                day.addClass('day_selected');
            }
        }, this));

        // this.preselect();
    }

    preselect() {
        if(this.source_data.months && this.source_data.months[this.month]) {
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

                let sorted_months = Object.keys(this.source_data.months).sort((a, b) => moment(a, 'MMMM').format('MM') - moment(b, 'MMMM').format('MM'));
                for (let month of sorted_months) {
                    let row = $('<tr></tr>');
                    row.append(`<td>${month}</td>`);
                    row.append(`<td>${this.source_data.months[month].join(',')}</td>`);
                    row.append(`<td>${this.source_data.months[month].length }</td>`);

                    this.table.find('tbody').append(row);
                }

                // console.log(Object.keys(this.source_data.months));
                if (this.source_data.months) {
                    utils.change_char_nice(this.jq.find('div.totalYear p.total'), Object.keys(this.source_data.months).reduce(
                        (sum, x) => sum + this.source_data.months[x].length
                        , 0));
                } 
                

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
            if (event.key == 'Enter') {
                this.user = $(event.currentTarget).val();


                // header.set_user(this.user);
                // this.source_data.user = this.user;
                // header.jq.find('div.user').removeClass('hide');

                // this.set_messaje('Please choose year');
                // this.jq.find('input').val('');
            }
        }, this));
    }

    check_new_user() {
        return new Promise((resolve, reject) =>{
             $.get( "/check_new_user", {user : this.user}, function( data ) {
                console.log(data.response);
                resolve(data.response);
            });
        });
    }
}

module.exports = LogIn;
},{"./Utils.js":7}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkY6XFxub2RlanNcXG5ld19leHByZXNzXFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL2NvbmZpZy9ob2xpZGF5Q29uZmlnLmpzIiwiRjovbm9kZWpzL25ld19leHByZXNzL3B1YmxpYy9qYXZhc2NyaXB0cy9mYWtlXzUwYWNhMjA4LmpzIiwiRjovbm9kZWpzL25ld19leHByZXNzL3B1YmxpYy9qYXZhc2NyaXB0cy9tYWluX21vZHVsZXMvRGF5cy5qcyIsIkY6L25vZGVqcy9uZXdfZXhwcmVzcy9wdWJsaWMvamF2YXNjcmlwdHMvbWFpbl9tb2R1bGVzL0Rpc3BsYXlJbnRlcnZhbHMuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL21haW5fbW9kdWxlcy9IZWFkZXIuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL21haW5fbW9kdWxlcy9Nb250aC5qcyIsIkY6L25vZGVqcy9uZXdfZXhwcmVzcy9wdWJsaWMvamF2YXNjcmlwdHMvbWFpbl9tb2R1bGVzL1V0aWxzLmpzIiwiRjovbm9kZWpzL25ld19leHByZXNzL3B1YmxpYy9qYXZhc2NyaXB0cy9tYWluX21vZHVsZXMvbG9nSW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJsZXQgY29uZmlnID0ge1xyXG4gIHN1YSA6IHtcclxuICAgIFwiSmFudWFyeVwiIDogWzJdLFxyXG4gICAgXCJNYXlcIiA6IFsyOV0sXHJcbiAgICBcIkp1bHlcIiA6IFs0XSxcclxuICAgIFwiU2VwdGVtYmVyXCIgOiBbNF0sXHJcbiAgICBcIk5vdmVtYmVyXCIgOiBbMjMsMjRdLFxyXG4gICAgXCJEZWNlbWJlclwiIDogWzI1XVxyXG4gIH0sXHJcbiAgcm9tIDoge1xyXG4gICAgXCJKYW51YXJ5XCIgOiBbMSwyLDI0XSxcclxuICAgIFwiQXByaWxcIiA6IFsxNiwxN10sXHJcbiAgICBcIk1heVwiIDogWzFdLFxyXG4gICAgXCJKdW5lXCIgOiBbMSw0LDVdLFxyXG4gICAgXCJBdWd1c3RcIiA6IFsxNV0sXHJcbiAgICBcIk5vdmVtYmVyXCIgOiBbMzBdLFxyXG4gICAgXCJEZWNlbWJlclwiIDogWzEsIDI1LCAyNl1cclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gY29uZmlnLnJvbTsiLCJsZXQgdXRpbHMgPSByZXF1aXJlKCcuL21haW5fbW9kdWxlcy9VdGlscy5qcycpO1xyXG5sZXQgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcvaG9saWRheUNvbmZpZy5qcycpO1xyXG5sZXQgTG9nSW4gPSByZXF1aXJlKCcuL21haW5fbW9kdWxlcy9sb2dJbi5qcycpO1xyXG5sZXQgSGVhZGVyID0gcmVxdWlyZSgnLi9tYWluX21vZHVsZXMvSGVhZGVyLmpzJyk7XHJcbmxldCBNb250aCA9IHJlcXVpcmUoJy4vbWFpbl9tb2R1bGVzL01vbnRoLmpzJyk7XHJcbmxldCBEYXlzID0gcmVxdWlyZSgnLi9tYWluX21vZHVsZXMvRGF5cy5qcycpO1xyXG5sZXQgRGlzcGxheUludGVydmFscyA9IHJlcXVpcmUoJy4vbWFpbl9tb2R1bGVzL0Rpc3BsYXlJbnRlcnZhbHMuanMnKTtcclxuXHJcbmxldCBzb3VyY2VfZGF0YSA9IHtcclxuICAgIHVzZXIgOiAnJyxcclxuICAgIHllYXI6ICcnLFxyXG4gICAgbW9udGhzOiB7fVxyXG59O1xyXG5cclxuaWYgKCFBcnJheS5wcm90b3R5cGUubGFzdCl7XHJcbiAgICBBcnJheS5wcm90b3R5cGUubGFzdCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNbdGhpcy5sZW5ndGggLSAxXTtcclxuICAgIH07XHJcbn1cclxuXHJcbmlmICghQXJyYXkucHJvdG90eXBlLnJlbW92ZSl7XHJcbiAgICBBcnJheS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24ocmVtb3ZlZF9lbGVtZW50KXtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgZWxlbWVudCBvZiB0aGlzKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50ICE9IHJlbW92ZWRfZWxlbWVudCkgcmVzdWx0LnB1c2goZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9O1xyXG59XHJcblxyXG4vLyAtLS0tLS0tLS0tIG1haW4gLS0tLS0tLS0tLS1cclxuXHJcbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xyXG4gICAgbGV0IGxvZ0luID0gbmV3IExvZ0luKCk7XHJcbiAgICBsZXQgdXNlciA9IHV0aWxzLmdldF91cmxfcGFyYW1zKCd1c2VyJyk7XHJcblxyXG4gICAgaWYgKCF1c2VyKSByZXR1cm4gMTtcclxuXHJcbiAgICBzb3VyY2VfZGF0YS51c2VyID0gdXNlcjtcclxuICAgIGxldCBoZWFkZXIgPSBuZXcgSGVhZGVyKCk7XHJcblxyXG4gICAgbGV0IHBhbmVsID0gbmV3IFBhbmVsKHVzZXIpO1xyXG4gICAgc291cmNlX2RhdGEueWVhciA9IHBhbmVsLnllYXI7XHJcblxyXG4gICAgbGV0IGRpc3BsYXlJbnRlcnZhbHMgPSBuZXcgRGlzcGxheUludGVydmFscyhzb3VyY2VfZGF0YS51c2VyLCBzb3VyY2VfZGF0YS55ZWFyLCBzb3VyY2VfZGF0YSk7XHJcbiAgICBwYW5lbC5kYXlzLnNhdmVfaW50ZXJ2YWwoZGlzcGxheUludGVydmFscyk7XHJcblxyXG4gICAgbG9nSW4uanEuaGlkZSgpO1xyXG4gICAgcGFuZWwuanEucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcclxuXHJcbiAgICBoZWFkZXIuanEuZmluZCgnZGl2LnVzZXInKS5yZW1vdmVDbGFzcygnaGlkZScpO1xyXG4gICAgaGVhZGVyLnNldF91c2VyKHVzZXIpO1xyXG4gICBcclxufSk7XHJcblxyXG4vLyAtLS0tLS0tLS0tIG1haW4gLS0tLS0tLS0tLS1cclxuXHJcbmNsYXNzIFBhbmVsIHtcclxuICAgIGNvbnN0cnVjdG9yKHVzZXIpIHtcclxuICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xyXG4gICAgICAgIHRoaXMueWVhciA9IHRoaXMuZ2V0WWVhcigpO1xyXG5cclxuXHJcbiAgICAgICAgY29uc29sZS5sb2codGhpcy55ZWFyKTtcclxuICAgICAgICB0aGlzLmpxID0gJCgnZGl2Lm1haW4gZGl2LnBhbmVsJyk7XHJcbiAgICAgICAgLy8gdGhpcy5qcS5yZW1vdmVDbGFzcygnaGlkZScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubW9udGggPSBuZXcgTW9udGgoKTtcclxuICAgICAgICB0aGlzLmRheXMgPSBuZXcgRGF5cyh0aGlzLm1vbnRoLm1vbnRoLCB0aGlzLnllYXIsIHNvdXJjZV9kYXRhKTtcclxuICAgICAgICB0aGlzLmRheXMuc2VsZWN0X2ludGVydmFsKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5tb250aC5jaGFuZ2VfbW9udGgodGhpcy5kYXlzKTtcclxuICAgICAgICB0aGlzLm1vbnRoLmNoYW5nZV9tb250aF91cF9kb3duKCk7XHJcblxyXG4gICAgICAgIHRoaXMub25DaGFuZ2VZZWFyKCk7XHJcbiAgICAgICAgdGhpcy5nZXRTb3VyY2VEYXRhKCkudGhlbigoZGF0YSkgPT4geyAgXHJcbiAgICAgICAgICAgIHNvdXJjZV9kYXRhLm1vbnRocyA9IGRhdGE7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHNvdXJjZV9kYXRhKTtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRheXMucHJlc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAkKCdkaXYuZGlzcGxheSB0YWJsZScpLnRyaWdnZXIoJ3JlbmRlckludGVydmFscycpO1xyXG4gICAgICAgICAgICB9LCAxMDAwKTtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIGdldFllYXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIE51bWJlcigvKFxcZCspLy5leGVjKCQoJ2Rpdi55ZWFyIGgyJykudGV4dCgpKVsxXSk7XHJcbiAgICB9XHJcblxyXG4gICAgb25DaGFuZ2VZZWFyKCkge1xyXG4gICAgICAgICQoJ2Rpdi55ZWFyIHAnKS5vbignY2xpY2snLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2NoYW5nZSB5ZWFyJyk7XHJcbiAgICAgICAgICAgIGxldCBkaXJlY3Rpb24gPSAvXnVwLy50ZXN0KCQoZXZlbnQuY3VycmVudFRhcmdldCkuYXR0cignY2xhc3MnKSkgPyAxIDogLTE7XHJcbiAgICAgICAgICAgIHRoaXMueWVhciA9IHRoaXMueWVhciArIGRpcmVjdGlvbjtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy55ZWFyKTtcclxuICAgICAgICAgICAgc291cmNlX2RhdGEueWVhciA9IHRoaXMueWVhcjtcclxuICAgICAgICAgICAgc291cmNlX2RhdGEubW9udGhzID0ge307XHJcblxyXG4gICAgICAgICAgICB0aGlzLmRheXMuc2V0WWVhcih0aGlzLnllYXIpO1xyXG4gICAgICAgICAgICB1dGlscy5yYW5kb21fdGV4dF9jaGFuZ2UoJCgnZGl2LnllYXIgaDInKSwgJ1llYXI6ICcgKyB0aGlzLnllYXIsIDEwMCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmdldFNvdXJjZURhdGEoKS50aGVuKChkYXRhKSA9PiB7ICBcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc291cmNlX2RhdGEubW9udGhzID0gZGF0YTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICQoJ2Rpdi5kaXNwbGF5IHRhYmxlJykudHJpZ2dlcigncmVuZGVySW50ZXJ2YWxzJyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFNvdXJjZURhdGEoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKCQucHJveHkoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcclxuICAgICAgICAgICAgJC5nZXQoIFwiL2NoZWNrX2RhdGFcIiwge3VzZXIgOiB0aGlzLnVzZXIsIHllYXI6IHRoaXMueWVhcn0sIGZ1bmN0aW9uKCBkYXRhICkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YS5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEucmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG59XHJcbiIsImxldCB1dGlscyA9IHJlcXVpcmUoJy4vVXRpbHMuanMnKTtcclxubGV0IGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZy9ob2xpZGF5Q29uZmlnLmpzJyk7XHJcblxyXG5jbGFzcyBEYXlzIHtcclxuICAgIGNvbnN0cnVjdG9yKG1vbnRoLCB5ZWFyLCBzb3VyY2VfZGF0YSkge1xyXG4gICAgICAgIHRoaXMuc291cmNlX2RhdGEgPSBzb3VyY2VfZGF0YTtcclxuXHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuY29sdW1ucyBkaXYuZGF5cycpO1xyXG5cclxuICAgICAgICB0aGlzLm1vbnRoID0gbW9udGg7XHJcbiAgICAgICAgdGhpcy55ZWFyID0geWVhcjtcclxuICAgICAgICB0aGlzLmRheXMgPSBbXTtcclxuICAgICAgICB0aGlzLmRheXNfbmFtZXMgPSBbJ00nLCAnVCcsICdXJywgJ1QnLCAnRicsICdTJywgJ1MnXTtcclxuICAgICAgICB0aGlzLnRvdGFsX2RheXMgPSAnJztcclxuICAgICAgICB0aGlzLmRheXNfc2VsZWN0ZWQgPSBbXTtcclxuICAgICAgICB0aGlzLnRvZGF5ID0gIHtcclxuICAgICAgICAgICAgZGF5IDogTnVtYmVyKG1vbWVudCgpLmZvcm1hdCgnREQnKSksXHJcbiAgICAgICAgICAgIG1vbnRoIDogTnVtYmVyKG1vbWVudCgpLmZvcm1hdCgnTU0nKSksXHJcbiAgICAgICAgICAgIHllYXIgOiBOdW1iZXIobW9tZW50KCkuZm9ybWF0KCdZWVlZJykpLFxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnRvZGF5KTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0X2RheXMoKTtcclxuICAgICAgICB0aGlzLmNoYW5nZV9kYXlzKCk7XHJcbiAgICAgICAgdGhpcy5jbGVhcigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMudG90YWxEaXNwbGF5ID0gMDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2V0WWVhcih5ZWFyKSB7XHJcbiAgICAgICAgdGhpcy55ZWFyID0geWVhcjtcclxuICAgICAgICB0aGlzLmpxLnRyaWdnZXIoJ21vbnRoX2NoYW5nZWQnLCB0aGlzLm1vbnRoKTtcclxuICAgIH1cclxuXHJcbiAgICBpbml0X2RheXMoKSB7XHJcbiAgICAgICAgdGhpcy50b3RhbF9kYXlzID0gbW9tZW50KHRoaXMueWVhciArICcgJyArIHRoaXMubW9udGgsIFwiWVlZWSBNTU1NXCIpLmRheXNJbk1vbnRoKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGRheV9uciA9IDE7IGRheV9uciA8PSB0aGlzLnRvdGFsX2RheXM7IGRheV9ucisrKSB7XHJcbiAgICAgICAgICAgIGxldCBkYXkgPSB0aGlzLmNyZWF0ZV9tb250aF9kYXkoZGF5X25yKTtcclxuICAgICAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYuY2FsZW5kYXInKS5hcHBlbmQoZGF5LmpxKTtcclxuICAgICAgICAgICAgdGhpcy5kYXlzLnB1c2goZGF5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBmaXJzdF9kYXkgPSB0aGlzLmRheXNbMF0uZGF5X29mX3dlZWsgfHwgNztcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpcnN0X2RheSAtIDE7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgZmlsbF9kYXlfcHJlcHBlbmQgPSB0aGlzLmNyZWF0ZV9tb250aF9kYXkoMCwgMSk7XHJcbiAgICAgICAgICAgIHRoaXMuanEuZmluZCgnZGl2LmNhbGVuZGFyJykucHJlcGVuZChmaWxsX2RheV9wcmVwcGVuZC5qcSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF5cy51bnNoaWZ0KGZpbGxfZGF5X3ByZXBwZW5kKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSA2OyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5jYWxlbmRhcicpLnByZXBlbmQoYDxwIGNsYXNzPVwiZGF5c19uYW1lXCI+JHt0aGlzLmRheXNfbmFtZXNbaV19PC9wPmApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVfbW9udGhfZGF5KGRheV9uciwgZmlsbCkge1xyXG4gICAgICAgIGxldCBkYXkgPSB7XHJcbiAgICAgICAgICAgIG5yIDogJycsXHJcbiAgICAgICAgICAgIGRheV9vZl93ZWVrIDogJycsXHJcbiAgICAgICAgICAgIGpxIDogJCgnPHAgY2xhc3M9XCJjbGlja2FibGVcIj48L3A+JyksXHJcbiAgICAgICAgICAgIHR5cGUgOiAnJ1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2V0X2RheShkYXksIGRheV9uciwgZmlsbCk7XHJcblxyXG4gICAgICAgIHJldHVybiBkYXk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0X2RheShkYXksIGRheV9uciwgZmlsbCkge1xyXG4gICAgICAgIGRheS5qcS5yZW1vdmVDbGFzcygnZmlsbCcpO1xyXG4gICAgICAgIGRheS5qcS5yZW1vdmVDbGFzcygnc3RhdGVfaG9saWRheScpO1xyXG4gICAgICAgIGRheS5qcS5yZW1vdmVDbGFzcygnd2Vla2VuZCcpO1xyXG4gICAgICAgIGRheS5qcS5yZW1vdmVDbGFzcygnZGF5X3Bhc3NlZCcpO1xyXG5cclxuICAgICAgICBpZiAoZmlsbCkge1xyXG4gICAgICAgICAgICBkYXkubnIgPSBkYXlfbnI7XHJcbiAgICAgICAgICAgIGRheS5kYXlfb2Zfd2VlayA9IC0xO1xyXG4gICAgICAgICAgICAvL2RheS5qcS50ZXh0KCcnKTtcclxuICAgICAgICAgICAgdXRpbHMuY2hhbmdlX2NoYXJfbmljZShkYXkuanEsICcnKTtcclxuICAgICAgICAgICAgZGF5LnR5cGUgPSdmaWxsJztcclxuICAgICAgICAgICAgZGF5LmpxLmFkZENsYXNzKCdmaWxsJyk7XHJcbiAgICAgICAgICAgIGRheS5qcS5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICBcclxuICAgICAgICAgICAgZGF5Lm5yID0gZGF5X25yO1xyXG4gICAgICAgICAgICBkYXkuZGF5X29mX3dlZWsgPSAgbW9tZW50KHRoaXMueWVhciArICcgJyArIHRoaXMubW9udGggKyAnICcgKyBkYXlfbnIsIFwiWVlZWSBNTU1NIEREXCIpLmRheSgpO1xyXG4gICAgICAgICAgICAvL2RheS5qcS50ZXh0KGRheS5ucik7XHJcbiAgICAgICAgICAgIHV0aWxzLmNoYW5nZV9jaGFyX25pY2UoZGF5LmpxLCBkYXkubnIpO1xyXG4gICAgICAgICAgICBkYXkudHlwZSA9IGRheS5kYXlfb2Zfd2VlayA9PSAwIHx8IGRheS5kYXlfb2Zfd2VlayA9PSA2ID8gJ3dlZWtlbmQnIDogJ25vcm1hbCc7XHJcblxyXG4gICAgICAgICAgICBkYXkudHlwZSA9IGNvbmZpZ1t0aGlzLm1vbnRoXSAmJiBjb25maWdbdGhpcy5tb250aF0uZmlsdGVyKCh4KSA9PiB4ID09IGRheS5ucikubGVuZ3RoID8gJ3N0YXRlX2hvbGlkYXknIDogZGF5LnR5cGU7XHJcbiAgICAgICAgICAgIGlmIChkYXkudHlwZSA9PSAnd2Vla2VuZCcpIGRheS5qcS5hZGRDbGFzcygnd2Vla2VuZCcpO1xyXG4gICAgICAgICAgICBpZiAoZGF5LnR5cGUgPT0gJ3N0YXRlX2hvbGlkYXknKSBkYXkuanEuYWRkQ2xhc3MoJ3N0YXRlX2hvbGlkYXknKTtcclxuICAgICAgICAgICAgaWYgKGRheS50eXBlICE9ICdub3JtYWwnKSB7XHJcbiAgICAgICAgICAgICAgICBkYXkuanEucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGF5LmpxLmFkZENsYXNzKCdjbGlja2FibGUnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IG1vbnRoID0gTnVtYmVyKG1vbWVudCh0aGlzLm1vbnRoLCAnTU1NTScpLmZvcm1hdCgnTU0nKSk7XHJcbiAgICAgICAgICAgIGlmKHRoaXMueWVhciA9PSB0aGlzLnRvZGF5LnllYXIpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRvZGF5Lm1vbnRoID09IG1vbnRoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYodGhpcy50b2RheS5kYXkgPiBkYXlfbnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF5LmpxLmFkZENsYXNzKCdkYXlfcGFzc2VkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnRvZGF5Lm1vbnRoID4gbW9udGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBkYXkuanEuYWRkQ2xhc3MoJ2RheV9wYXNzZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnllYXIgPCB0aGlzLnRvZGF5LnllYXIpIHtcclxuICAgICAgICAgICAgICAgIGRheS5qcS5hZGRDbGFzcygnZGF5X3Bhc3NlZCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBjaGFuZ2VfZGF5cygpIHtcclxuICAgICAgICB0aGlzLmpxLm9uKCdtb250aF9jaGFuZ2VkJywgJC5wcm94eShmdW5jdGlvbihldmVudCwgbW9udGgpIHtcclxuICAgICAgICAgICAgdGhpcy5jbGVhcl9zZWxlY3QoKTtcclxuICAgICAgICAgICAgdGhpcy5tb250aCA9IG1vbnRoO1xyXG4gICAgICAgICAgICB0aGlzLnRvdGFsX2RheXMgPSBtb21lbnQodGhpcy55ZWFyICsgJyAnICsgdGhpcy5tb250aCwgXCJZWVlZIE1NTU1cIikuZGF5c0luTW9udGgoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBmaXJzdF93ZWVrX2RheSA9IG1vbWVudCh0aGlzLnllYXIgKyAnICcgKyB0aGlzLm1vbnRoICsgJyAnICsgMSwgXCJZWVlZIE1NTU0gRERcIikuZGF5KCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgdG90YWxfZm9yX2xlbmdodCA9IHRoaXMudG90YWxfZGF5cyArIChmaXJzdF93ZWVrX2RheSA9PSAwID8gNiA6IGZpcnN0X3dlZWtfZGF5IC0gMSk7XHJcbiAgICAgICAgICAgIHRvdGFsX2Zvcl9sZW5naHQgPSB0b3RhbF9mb3JfbGVuZ2h0ID4gdGhpcy5kYXlzLmxlbmd0aCA/IHRvdGFsX2Zvcl9sZW5naHQgOiB0aGlzLmRheXMubGVuZ3RoO1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudF9tbW9udGhfZGF5X25yID0gMTtcclxuXHJcbiAgICAgICAgICAgIGxldCB0aW1tZXIgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsX2Zvcl9sZW5naHQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgkLnByb3h5KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZGF5c1tpXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGZpcnN0X3dlZWtfZGF5ID09IDAgJiYgaSA8IDYpIHx8IChmaXJzdF93ZWVrX2RheSA+IGkgKyAxKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRfZGF5KHRoaXMuZGF5c1tpXSwgMCwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudF9tbW9udGhfZGF5X25yIDw9IHRoaXMudG90YWxfZGF5cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRfZGF5KHRoaXMuZGF5c1tpXSwgY3VycmVudF9tbW9udGhfZGF5X25yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfbW1vbnRoX2RheV9ucisrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXlzW2ldLmpxLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXlzW2ldID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZGF5ID0gdGhpcy5jcmVhdGVfbW9udGhfZGF5KGN1cnJlbnRfbW1vbnRoX2RheV9ucik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuanEuZmluZCgnZGl2LmNhbGVuZGFyJykuYXBwZW5kKGRheS5qcSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF5cy5wdXNoKGRheSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfbW1vbnRoX2RheV9ucisrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sIHRoaXMpLCB0aW1tZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRpbW1lciArPSAzMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2V0VGltZW91dCgkLnByb3h5KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRheXMgPSB0aGlzLmRheXMuZmlsdGVyKCh4KSA9PiB4KTtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJlc2VsZWN0KCk7XHJcbiAgICAgICAgICAgIH0sIHRoaXMpLCB0aW1tZXIgKyAyMDApO1xyXG5cclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2VsZWN0X2ludGVydmFsKCkge1xyXG4gICAgICAgIHRoaXMuanEuZmluZCgnZGl2LmNhbGVuZGFyJykub24oJ2NsaWNrJywgJ3AnLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgICAgbGV0IGRheSA9ICQoZXZlbnQuY3VycmVudFRhcmdldCk7XHJcbiAgICAgICAgICAgIGxldCB0b3RhbERpc3BsYXkgPSAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2IGRpdi5tb250aCBkaXYudG90YWwgcCcpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnaW4nKTtcclxuICAgICAgICAgICAgaWYgKGRheS5oYXNDbGFzcygnZGF5X3NlbGVjdGVkJykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF5c19zZWxlY3RlZCA9IHRoaXMuZGF5c19zZWxlY3RlZC5yZW1vdmUoZGF5LnRleHQoKSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvdGFsRGlzcGxheSA9IHRoaXMudG90YWxEaXNwbGF5IC0gMTsgXHJcbiAgICAgICAgICAgICAgICB1dGlscy5jaGFuZ2VfY2hhcl9uaWNlKHRvdGFsRGlzcGxheSwgdGhpcy50b3RhbERpc3BsYXkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGRheS5yZW1vdmVDbGFzcygnZGF5X3NlbGVjdGVkJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoL2NsaWNrYWJsZS8udGVzdChkYXkuYXR0cignY2xhc3MnKSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF5c19zZWxlY3RlZC5wdXNoKE51bWJlcihkYXkudGV4dCgpKSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvdGFsRGlzcGxheSA9IHRoaXMudG90YWxEaXNwbGF5ICsgMTtcclxuICAgICAgICAgICAgICAgIHV0aWxzLmNoYW5nZV9jaGFyX25pY2UodG90YWxEaXNwbGF5LCB0aGlzLnRvdGFsRGlzcGxheSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZGF5LmFkZENsYXNzKCdkYXlfc2VsZWN0ZWQnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5wcmVzZWxlY3QoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcmVzZWxlY3QoKSB7XHJcbiAgICAgICAgaWYodGhpcy5zb3VyY2VfZGF0YS5tb250aHMgJiYgdGhpcy5zb3VyY2VfZGF0YS5tb250aHNbdGhpcy5tb250aF0pIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgZGF5X3NlbGVjdGVkIG9mIHRoaXMuc291cmNlX2RhdGEubW9udGhzW3RoaXMubW9udGhdKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBjdXJyZW50X2RheSBvZiB0aGlzLmRheXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudF9kYXkubnIgPT0gZGF5X3NlbGVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfZGF5LmpxLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGVhcigpIHtcclxuICAgICAgICAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2LmFjdGlvbnMgZGl2LmNsZWFyX3NlbGVjdGlvbicpLm9uKCdjbGljaycsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpcmVkJyk7XHJcbiAgICAgICAgICAgIHRoaXMuY2xlYXJfc2VsZWN0KCk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnNvdXJjZV9kYXRhLm1vbnRoc1t0aGlzLm1vbnRoXTtcclxuICAgICAgICAgICAgJCgnZGl2Lm1haW4gZGl2LnBhbmVsIGRpdi5kaXNwbGF5IHRhYmxlJykudHJpZ2dlcigncmVuZGVySW50ZXJ2YWxzJyk7XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyX3NlbGVjdCgpIHtcclxuICAgICAgICBmb3IgKGxldCBkYXkgb2YgdGhpcy5kYXlzKSB7XHJcbiAgICAgICAgICAgIGRheS5qcS5yZW1vdmVDbGFzcygnZGF5X3NlbGVjdGVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZGF5c19zZWxlY3RlZCA9IFtdO1xyXG4gICAgICAgIHRoaXMudG90YWxEaXNwbGF5ID0gMFxyXG4gICAgICAgIHV0aWxzLmNoYW5nZV9jaGFyX25pY2UoJCgnZGl2Lm1haW4gZGl2LnBhbmVsIGRpdiBkaXYubW9udGggZGl2LnRvdGFsIHAnKSwgdGhpcy50b3RhbERpc3BsYXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmVfaW50ZXJ2YWwoZGlzcGxheSkge1xyXG5cclxuICAgICAgICB0aGlzLmpxLnBhcmVudCgpLmZpbmQoJ2Rpdi5hY3Rpb25zIGRpdi5zYXZlX2ludGVydmFsJykub24oJ2NsaWNrJywgJC5wcm94eShmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5kYXlzX3NlbGVjdGVkLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zb3VyY2VfZGF0YS5tb250aHNbdGhpcy5tb250aF0gPSB0aGlzLmRheXNfc2VsZWN0ZWQ7XHJcbiAgICAgICAgICAgICAgICBkaXNwbGF5LnRhYmxlLnRyaWdnZXIoJ3JlbmRlckludGVydmFscycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuc291cmNlX2RhdGEpO1xyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRGF5cztcclxuIiwibGV0IHV0aWxzID0gcmVxdWlyZSgnLi9VdGlscy5qcycpO1xyXG5cclxuY2xhc3MgRGlzcGxheUludGVydmFscyB7XHJcbiAgICBjb25zdHJ1Y3Rvcih1c2VyLCB5ZWFyLCBzb3VyY2VfZGF0YSkge1xyXG4gICAgICAgIHRoaXMuc291cmNlX2RhdGEgPSBzb3VyY2VfZGF0YTtcclxuXHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuZGlzcGxheScpO1xyXG4gICAgICAgIHRoaXMuanEucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcclxuXHJcbiAgICAgICAgdGhpcy50YWJsZSA9IHRoaXMuanEuZmluZCgndGFibGUnKTtcclxuICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xyXG4gICAgICAgIHRoaXMueWVhciA9IHllYXI7XHJcbiAgICAgICAgLy90aGlzLnNhdmVfZGF0YSA9IHt9O1xyXG5cclxuICAgICAgICB0aGlzLnRvZ2dsZV9wYW5lbCgpO1xyXG4gICAgICAgIHRoaXMucmVuZGVyX2ludGVydmFscygpO1xyXG4gICAgICAgIHRoaXMuc2V0X3BhbmVsX21vbnRoKCk7XHJcbiAgICAgICAgdGhpcy5zYXZlX2ludGVydmFscygpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICB0b2dnbGVfcGFuZWwoKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdwLnRpdGxlIHNwYW4nKS5vbignY2xpY2snLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuY29sdW1ucycpLnRvZ2dsZUNsYXNzKCdoaWRlJyk7XHJcbiAgICAgICAgICAgIHRoaXMuanEuZmluZCgncC5zYXZlUFRPJykudG9nZ2xlQ2xhc3MoJ2hpZGUnKTtcclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyX2ludGVydmFscygpIHtcclxuICAgICAgICB0aGlzLnRhYmxlLm9uKCdyZW5kZXJJbnRlcnZhbHMnLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50LCBpbnRpdGlhbF9yZW5kZXIpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnNvdXJjZV9kYXRhLm1vbnRocyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRhYmxlLmFkZENsYXNzKCdoaWRlX2Zvcl9yZW5kZXInKTtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgkLnByb3h5KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLmZpbmQoJ3Rib2R5JykuaHRtbCgnJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHNvcnRlZF9tb250aHMgPSBPYmplY3Qua2V5cyh0aGlzLnNvdXJjZV9kYXRhLm1vbnRocykuc29ydCgoYSwgYikgPT4gbW9tZW50KGEsICdNTU1NJykuZm9ybWF0KCdNTScpIC0gbW9tZW50KGIsICdNTU1NJykuZm9ybWF0KCdNTScpKTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IG1vbnRoIG9mIHNvcnRlZF9tb250aHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcm93ID0gJCgnPHRyPjwvdHI+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcm93LmFwcGVuZChgPHRkPiR7bW9udGh9PC90ZD5gKTtcclxuICAgICAgICAgICAgICAgICAgICByb3cuYXBwZW5kKGA8dGQ+JHt0aGlzLnNvdXJjZV9kYXRhLm1vbnRoc1ttb250aF0uam9pbignLCcpfTwvdGQ+YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcm93LmFwcGVuZChgPHRkPiR7dGhpcy5zb3VyY2VfZGF0YS5tb250aHNbbW9udGhdLmxlbmd0aCB9PC90ZD5gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50YWJsZS5maW5kKCd0Ym9keScpLmFwcGVuZChyb3cpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKE9iamVjdC5rZXlzKHRoaXMuc291cmNlX2RhdGEubW9udGhzKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zb3VyY2VfZGF0YS5tb250aHMpIHtcclxuICAgICAgICAgICAgICAgICAgICB1dGlscy5jaGFuZ2VfY2hhcl9uaWNlKHRoaXMuanEuZmluZCgnZGl2LnRvdGFsWWVhciBwLnRvdGFsJyksIE9iamVjdC5rZXlzKHRoaXMuc291cmNlX2RhdGEubW9udGhzKS5yZWR1Y2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChzdW0sIHgpID0+IHN1bSArIHRoaXMuc291cmNlX2RhdGEubW9udGhzW3hdLmxlbmd0aFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAsIDApKTtcclxuICAgICAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLnJlbW92ZUNsYXNzKCdoaWRlX2Zvcl9yZW5kZXInKTtcclxuICAgICAgICAgICAgICAgIGlmIChpbnRpdGlhbF9yZW5kZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLmZpbmQoJ3Rib2R5IHRyJykuZmlyc3QoKS50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCB0aGlzKSwgNjAwKTtcclxuXHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldF9wYW5lbF9tb250aCgpIHtcclxuICAgICAgICB0aGlzLnRhYmxlLm9uKCdjbGljaycsJ3Rib2R5IHRyJywgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhldmVudCk7XHJcbiAgICAgICAgICAgIGxldCBtb250aCA9ICQodGhpcykuZmluZCgndGQnKS5maXJzdCgpLnRleHQoKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cobW9udGgpO1xyXG4gICAgICAgICAgICAkKCdkaXYubW9udGhfaW5wdXQgcC5tb250aF90ZXh0JykudHJpZ2dlcignbW9udGhfY2hhbmdlZCcsIG1vbnRoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzYXZlX2ludGVydmFscygpIHtcclxuICAgICAgICAkKCdkaXYuYWN0aW9ucyBkaXYuc2F2ZVBUTycpLm9uKCdjbGljaycsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5zb3VyY2VfZGF0YSk7XHJcbiAgICAgICAgICAgICQucG9zdCggXCIvdXBkYXRlXCIsIHRoaXMuc291cmNlX2RhdGEsIGZ1bmN0aW9uKCBkYXRhICkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YS5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRGlzcGxheUludGVydmFsczsiLCJsZXQgdXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzLmpzJyk7XHJcblxyXG5jbGFzcyBIZWFkZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5oZWFkZXInKTtcclxuICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy5qcS5maW5kKCdzcGFuJykudGV4dCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldF91c2VyKHVzZXJfbmFtZSkge1xyXG4gICAgICAgIHRoaXMuanEuZmluZCgnZGl2LnVzZXInKS5jc3MoJ29wYWNpdHknLCAnMScpO1xyXG4gICAgICAgIHV0aWxzLnJhbmRvbV90ZXh0X2NoYW5nZSh0aGlzLmpxLmZpbmQoJ3AnKS5maXJzdCgpLCB1c2VyX25hbWUsIDEwMCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNldF95ZWFyKHllYXIpIHtcclxuXHJcbiAgICAgICAgaWYgKC8gLSBcXGR7NH0vLnRlc3QodGhpcy50aXRsZSkpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh5ZWFyKTtcclxuICAgICAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMudGl0bGUucmVwbGFjZSgvXFxkezR9LywgeWVhcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMudGl0bGUgKyAnIC0gJyArIHllYXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1dGlscy5yYW5kb21fdGV4dF9jaGFuZ2UodGhpcy5qcS5maW5kKCdzcGFuJykuZmlyc3QoKSwgdGhpcy50aXRsZSwgMTAwKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBIZWFkZXI7IiwibGV0IHV0aWxzID0gcmVxdWlyZSgnLi9VdGlscy5qcycpO1xyXG5cclxuY2xhc3MgTW9udGgge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuY29sdW1ucyBkaXYubW9udGgnKTtcclxuICAgICAgICB0aGlzLm1vbnRoID0gdGhpcy5qcS5maW5kKCdwLm1vbnRoX3RleHQnKS50ZXh0KCk7XHJcbiAgICAgICAgdGhpcy5tb250aHNfaW5feWVhciA9IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5JywgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddO1xyXG4gICAgfVxyXG5cclxuICAgIHNldF9tb250aChtb250aCkge1xyXG4gICAgICAgIHRoaXMubW9udGggPSBtb250aDtcclxuICAgICAgICB1dGlscy5yYW5kb21fdGV4dF9jaGFuZ2UodGhpcy5qcS5maW5kKCdwLm1vbnRoX3RleHQnKS5maXJzdCgpLG1vbnRoLCAxMDApO1xyXG4gICAgfVxyXG5cclxuICAgIGNoYW5nZV9tb250aF91cF9kb3duKCkge1xyXG4gICAgICAgIHRoaXMuanEuZmluZCgncC51cCxwLmRvd24nKS5vbignY2xpY2snLCAkLnByb3h5KGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubW9udGhzX2luX3llYXIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1vbnRoID09IHRoaXMubW9udGhzX2luX3llYXJbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dF9tb250aCA9ICh0aGlzLm1vbnRoc19pbl95ZWFyW2kgKyAxXSB8fCB0aGlzLm1vbnRoc19pbl95ZWFyWzBdKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcHJldmlvdXNfbW9udGggPSAodGhpcy5tb250aHNfaW5feWVhcltpIC0gMV0gfHwgdGhpcy5tb250aHNfaW5feWVhci5sYXN0KCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmhhc0NsYXNzKCd1cCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0X21vbnRoKG5leHRfbW9udGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0X21vbnRoKHByZXZpb3VzX21vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5qcS5maW5kKCdwLm1vbnRoX3RleHQnKS50cmlnZ2VyKCdtb250aF9jaGFuZ2VkJywgdGhpcy5tb250aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIGNoYW5nZV9tb250aChkYXlzKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdwLm1vbnRoX3RleHQnKS5vbignbW9udGhfY2hhbmdlZCcsICQucHJveHkoZnVuY3Rpb24gKGV2ZW50LCBtb250aCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldF9tb250aChtb250aCk7XHJcbiAgICAgICAgICAgIGRheXMuanEudHJpZ2dlcignbW9udGhfY2hhbmdlZCcsIHRoaXMubW9udGgpO1xyXG4gICAgICAgIH0sdGhpcykpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vbnRoOyIsIm1vZHVsZS5leHBvcnRzLnJhbmRvbV90ZXh0X2NoYW5nZSA9ICBmdW5jdGlvbiAoanFfb2JqLCB0ZXh0X25ldywgdGltbWVyKSB7XHJcblxyXG4gICAgbGV0IFssd2lkdGhdID0gLyhcXGQrKS8uZXhlYyhqcV9vYmouY3NzKCdmb250LXNpemUnKSk7XHJcblxyXG4gICAgbGV0IHJhbmRvbV9jaGFuZ2Vfc3R5bGUgPSAkKCc8c3R5bGUgdHlwZT1cInRleHQvY3NzXCI+PC9zdHlsZT4nKTtcclxuICAgIHJhbmRvbV9jaGFuZ2Vfc3R5bGUudGV4dChcclxuICAgICAgICAnLnJhbmRvbV9jaGFuZ2UgeyBkaXNwbGF5OmlubGluZS1ibG9jazsgbWluLXdpZHRoOiAwcHg7IHRyYW5zaXRpb246IGFsbCAnICsgdGltbWVyIC8gMTAwMCArICdzO30gJyArXHJcbiAgICAgICAgJy5yYW5kb21fY2hhbmdlX3NwYW5faGlkZSB7IG1pbi13aWR0aDogJyArIHdpZHRoLzIgKyAncHg7IG9wYWNpdHk6MDsgfSAnICtcclxuICAgICAgICAnLnJhbmRvbV9jaGFuZ2Vfc3Bhbl9yZW1vdmUgeyBtaW4td2lkdGg6ICcgKyB3aWR0aC8yICsgJ3B4OyBvcGFjaXR5OjA7IH0nXHJcbiAgICApO1xyXG4gICAgJCgnaGVhZCcpLnByZXBlbmQocmFuZG9tX2NoYW5nZV9zdHlsZSk7XHJcblxyXG4gICAgbGV0IGNoYXJzX25ldyA9IHRleHRfbmV3LnNwbGl0KCcnKTtcclxuICAgIGxldCBjaGFyc19vcmcgPSBqcV9vYmoudGV4dCgpLnNwbGl0KCcnKTtcclxuICAgIGxldCBtYXhfbnIgPSBjaGFyc19uZXcubGVuZ3RoID4gY2hhcnNfb3JnLmxlbmd0aCA/IGNoYXJzX25ldy5sZW5ndGggOiBjaGFyc19vcmcubGVuZ3RoO1xyXG5cclxuICAgIGpxX29iai50ZXh0KCcnKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4X25yOyBpKyspIHtcclxuICAgICAgICBpZiAoY2hhcnNfb3JnW2ldKSB7XHJcbiAgICAgICAgICAgIGNoYXJzX29yZ1tpXSA9ICQoYDxzcGFuIGNsYXNzPSdyYW5kb21fY2hhbmdlJz4ke2NoYXJzX29yZ1tpXX08L3NwYW4+YCk7XHJcbiAgICAgICAgICAgIGNoYXJzX29yZ1tpXTtcclxuICAgICAgICAgICAgaWYgKGNoYXJzX29yZ1tpXS50ZXh0KCkgPT0gJyAnKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFyc19vcmdbaV0uY3NzKCdtaW4td2lkdGgnLCB3aWR0aC8zLTEgKyAncHgnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjaGFyc19vcmdbaV0gPSAkKGA8c3BhbiBjbGFzcz0ncmFuZG9tX2NoYW5nZSc+PC9zcGFuPmApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAganFfb2JqLmFwcGVuZChjaGFyc19vcmdbaV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBjb3VudGVyID0gWy4uLkFycmF5KG1heF9ucikua2V5cygpXTtcclxuXHJcbiAgICBjb3VudGVyLnNodWZmbGUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaSA9IHRoaXMubGVuZ3RoLCBqLCB0ZW1wO1xyXG4gICAgICAgIGlmICggaSA9PSAwICkgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgd2hpbGUgKCAtLWkgKSB7XHJcbiAgICAgICAgICAgIGogPSBNYXRoLmZsb29yKCBNYXRoLnJhbmRvbSgpICogKCBpICsgMSApICk7XHJcbiAgICAgICAgICAgIHRlbXAgPSB0aGlzW2ldO1xyXG4gICAgICAgICAgICB0aGlzW2ldID0gdGhpc1tqXTtcclxuICAgICAgICAgICAgdGhpc1tqXSA9IHRlbXA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBjb3VudGVyID0gY291bnRlci5zaHVmZmxlKCk7XHJcbiAgICBsZXQgaW5pdGlhbF90aW1lID0gdGltbWVyO1xyXG4gICAgZm9yIChsZXQgaW5kZXggb2YgY291bnRlcikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgY2hhcnNfb3JnW2luZGV4XSAhPSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgY2hhcnNfbmV3W2luZGV4XSAhPSAndW5kZWZpbmVkJykge1xyXG5cclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0uYWRkQ2xhc3MoJ3JhbmRvbV9jaGFuZ2Vfc3Bhbl9oaWRlJyk7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFyc19uZXdbaW5kZXhdID09ICcgJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFyc19vcmdbaW5kZXhdLmNzcygnd2lkdGgnLCAnOHB4Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0udGV4dChjaGFyc19uZXdbaW5kZXhdKTtcclxuICAgICAgICAgICAgICAgICAgICBjaGFyc19vcmdbaW5kZXhdLnJlbW92ZUNsYXNzKCdyYW5kb21fY2hhbmdlX3NwYW5faGlkZScpO1xyXG4gICAgICAgICAgICAgICAgfSxpbml0aWFsX3RpbWUpXHJcblxyXG4gICAgICAgICAgICB9LCB0aW1tZXIpO1xyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjaGFyc19uZXdbaW5kZXhdID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFyc19vcmdbaW5kZXhdLmFkZENsYXNzKCdyYW5kb21fY2hhbmdlX3NwYW5fcmVtb3ZlJyk7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhcnNfb3JnW2luZGV4XS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIH0sIGluaXRpYWxfdGltZSk7XHJcbiAgICAgICAgICAgIH0sIHRpbW1lcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aW1tZXIgKz0gaW5pdGlhbF90aW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAganFfb2JqLmh0bWwoanFfb2JqLnRleHQoKSk7XHJcbiAgICAgICAgcmFuZG9tX2NoYW5nZV9zdHlsZS5yZW1vdmUoKTtcclxuXHJcbiAgICB9LCBpbml0aWFsX3RpbWUgKyB0aW1tZXIpO1xyXG5cclxufVxyXG5cclxubGV0IHF1ZV9zaW5nbGVfY2hhciA9IFtdO1xyXG5tb2R1bGUuZXhwb3J0cy5jaGFuZ2VfY2hhcl9uaWNlID0gZnVuY3Rpb24oanFfb2JqLCBuZXdfdGV4dCkge1xyXG4gICAgcXVlX3NpbmdsZV9jaGFyLnB1c2gobmV3X3RleHQpO1xyXG4gICAganFfb2JqLnJlbW92ZUNsYXNzKCdzaW5nbGVfY2hhcl9jaGFuZ2UnKTtcclxuICAgIGpxX29iai5hZGRDbGFzcygnc2luZ2xlX2NoYXJfY2hhbmdlJyk7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAganFfb2JqLnRleHQocXVlX3NpbmdsZV9jaGFyLnNoaWZ0KCkpO1xyXG4gICAgfSwgMjUwKTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBqcV9vYmoucmVtb3ZlQ2xhc3MoJ3NpbmdsZV9jaGFyX2NoYW5nZScpO1xyXG4gICAgfSwgNjAwKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuZ2V0X3VybF9wYXJhbXMgPSBmdW5jdGlvbihwYXJhbSkge1xyXG4gICAgbGV0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xyXG5cclxuICAgIGxldCByZXN1bHQgPSBuZXcgUmVnRXhwKCdbXFw/Jl0nICsgcGFyYW0gKyAnPShbXiYjXSopJykuZXhlYyh3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcbiAgICByZXN1bHQgPSByZXN1bHQmJnJlc3VsdFsxXTtcclxuICAgIC8vIGlmKCFyZXN1bHQpIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKCcvJyk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuYW5pbWF0ZV93cm9uZyA9IGZ1bmN0aW9uKGpxX29iaikge1xyXG4gICAganFfb2JqLmFkZENsYXNzKCd3cm9uZ192YWwnKTtcclxuICAgIGxldCBhbmltYXRpb25fdGltZSA9IE51bWJlcigvKFtcXGRcXC5dKykvLmV4ZWMoanFfb2JqLmNzcygnYW5pbWF0aW9uJykpWzFdKTtcclxuICAgIHNldFRpbWVvdXQoJC5wcm94eShmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKCd3cm9uZ192YWwnKTtcclxuICAgIH0sIGpxX29iaiksIGFuaW1hdGlvbl90aW1lICogMTAwMClcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuc2VuZEpzb24gPSBmdW5jdGlvbih1cmwsIGpzb24pIHtcclxuICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGpzb24pLFxyXG4gICAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLTgnLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihtc2cpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUobXNnKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgcmVqZWN0KEVycm9yKGVycikpO1xyXG4gICAgICAgIH0pO1xyXG4gICB9KTtcclxufSIsImxldCB1dGlscyA9IHJlcXVpcmUoJy4vVXRpbHMuanMnKTtcclxuXHJcbmNsYXNzIExvZ0luIHtcclxuICAgIGNvbnN0cnVjdG9yKHNvdXJjZV9kYXRhKSB7XHJcbiAgICAgICAgdGhpcy5zb3VyY2VfZGF0YSA9IHNvdXJjZV9kYXRhO1xyXG4gICAgICAgIHRoaXMuanEgPSAkKCdkaXYubG9nX2luJyk7XHJcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gJ0xvZyBpbiB3aXRoIGVtYWlsJztcclxuICAgICAgICB0aGlzLnVzZXIgPSAnJztcclxuICAgIH1cclxuXHJcbiAgICBzZXRfbWVzc2FqZShtZXNzYWplKSB7XHJcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FqZTtcclxuICAgICAgICB1dGlscy5yYW5kb21fdGV4dF9jaGFuZ2UodGhpcy5qcS5maW5kKCdwJykuZmlyc3QoKSwgbWVzc2FqZSwgMTAwKTtcclxuICAgIH1cclxuXHJcbiAgICBzZW5kX2lucHV0X3RleHQoaGVhZGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuanEuZmluZCgnaW5wdXQnKS5vbigna2V5cHJlc3MnLCAkLnByb3h5KCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5ID09ICdFbnRlcicpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlciA9ICQoZXZlbnQuY3VycmVudFRhcmdldCkudmFsKCk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIC8vIGhlYWRlci5zZXRfdXNlcih0aGlzLnVzZXIpO1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5zb3VyY2VfZGF0YS51c2VyID0gdGhpcy51c2VyO1xyXG4gICAgICAgICAgICAgICAgLy8gaGVhZGVyLmpxLmZpbmQoJ2Rpdi51c2VyJykucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyB0aGlzLnNldF9tZXNzYWplKCdQbGVhc2UgY2hvb3NlIHllYXInKTtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuanEuZmluZCgnaW5wdXQnKS52YWwoJycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIGNoZWNrX25ld191c2VyKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PntcclxuICAgICAgICAgICAgICQuZ2V0KCBcIi9jaGVja19uZXdfdXNlclwiLCB7dXNlciA6IHRoaXMudXNlcn0sIGZ1bmN0aW9uKCBkYXRhICkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YS5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEucmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb2dJbjsiXX0=
