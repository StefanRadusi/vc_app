(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 *  Created by stef on 12/29/2016.
 */
let config = require('./holidayConfig.js');
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

    let logIn = new LogIn();
    logIn.send_input_text(header);
    //logIn.jq.hide();

    $(document).on('user_year_set', function() {
        console.log(source_data);
        let panel = new Panel(source_data.year);
        panel.days.select_interval();
    
        let displayIntervals = new DisplayIntervals(source_data.user, source_data.year);
        panel.days.save_interval(displayIntervals);
    });

});

// ---------- main -----------

class Header {
    constructor() {
            this.jq = $('div.header');
            this.title = this.jq.find('span').text();
    
        }
    
    set_user(user_name) {
            //this.user = user_name;
            this.jq.find('p').text(user_name);
            //this.jq.find('div.user').removeClass('hide');
        }
    
    set_year(year) {
    
            if (/ - \d{4}/.test(this.title)){
                console.log(year);
                this.title = this.title.replace(/\d{4}/, year);
            } else {
                this.title = this.title + ' - ' + year;
            }
    
            this.jq.find('span').text(this.title);
    }
}


class LogIn {
    constructor() {
        this.jq = $('div.log_in');
        this.message = 'Log in with email';
        this.user = '';
    }

    set_messaje(messaje) {
        this.message = messaje;
        this.jq.find('p').text(this.message);
    }

    send_input_text(header) {
        return this.jq.find('input').on('keypress', $.proxy( function(event) {
            if (event.key == 'Enter' && !this.user) {
                this.user = $(event.currentTarget).val();
                
                //console.log(header);
                header.set_user(this.user);
                source_data.user = this.user;
                header.jq.find('div.user').removeClass('hide');
                
                this.set_messaje('Please choose year');
                this.jq.find('input').val('');
            } else if (event.key == 'Enter') {
                this.year = $(event.currentTarget).val();
                if (/^\d{4}$/.test(this.year)) {
                    header.set_year(this.year);
                    this.jq.hide();
                }
                source_data.year = this.year;
                
                $(document).trigger('user_year_set');
                
                $.get( "/check_data", {user : this.user, year: this.year}, function( data ) {
                    source_data.months = data.response;
                    console.log(source_data);
                    
                    $('div.display table').trigger('renderIntervals');
                    $('div.display table tbody tr').first().trigger('click');
                });
            }
        }, this));
    }
}

class Panel {
    constructor(year) {
        this.year = year;
        this.jq = $('div.main div.panel');
        this.jq.removeClass('hide');
        this.month = new Month();
        this.days = new Days(this.month.month, year);
        this.month.change_month(this.days);
        this.month.change_month_up_down();
        
    }
}

class Month {
    constructor() {
        this.jq = $('div.main div.panel div.columns div.month');
        this.month = this.jq.find('p.month_text').text();
        this.months_in_year = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    }

    set_month(month) {
        this.month = month;
        this.jq.find('p.month_text').text(month);
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

class Days {
    constructor(month, year) {
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
            day.jq.text('');
            day.type ='fill';
            day.jq.addClass('fill');
        } else {
            day.nr = day_nr;
            day.day_of_week =  moment(this.year + ' ' + this.month + ' ' + day_nr, "YYYY MMMM DD").day();
            day.jq.text(day.nr);
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

            for (let i = 0; i < total_for_lenght; i++) {
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
            }
            this.days = this.days.filter((x) => x);

            this.preselect();
        }, this));
    }

    select_interval() {
        this.jq.find('div.calendar').on('click', 'p', $.proxy(function(event){
            let day = $(event.currentTarget);
            let totalDisplay = $('div.main div.panel div div.month div.total p');

            if (day.hasClass('day_selected')) {
                this.days_selected = this.days_selected.remove(day.text());
                totalDisplay.text(Number(totalDisplay.text()) - 1);

                day.removeClass('day_selected');
            } else if (day.hasClass('')) {
                this.days_selected.push(Number(day.text()));
                totalDisplay.text(Number(totalDisplay.text()) + 1);

                day.addClass('day_selected');
            }
        }, this));

        this.preselect();
    }

    preselect() {
        if(source_data.months[this.month]) {
            for (let day_selected of source_data.months[this.month]) {
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
            delete source_data.months[this.month];
            $('div.main div.panel div.display table').trigger('renderIntervals');
        }, this));
    }

    clear_select() {
        for (let day of this.days) {
            day.jq.removeClass('day_selected');
        }
        this.days_selected = [];
        $('div.main div.panel div div.month div.total p').text(0);
    }

    save_interval(display) {

        this.jq.parent().find('div.actions div.save_interval').on('click', $.proxy(function(event) {
            if (this.days_selected.length) {
                source_data.months[this.month] = this.days_selected;
                display.table.trigger('renderIntervals');
            }
            console.log(source_data);
        }, this));
    }

}

class DisplayIntervals {
    constructor(user, year) {
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
            console.log(source_data.months);
            this.table.find('tbody').html('');
            for (let month in source_data.months) {
                let row = $('<tr></tr>');
                row.append(`<td>${month}</td>`);
                row.append(`<td>${source_data.months[month].join(',')}</td>`);
                row.append(`<td>${source_data.months[month].length }</td>`);

                this.table.find('tbody').append(row);
            }

            console.log(Object.keys(source_data.months));
            this.jq.find('div.totalYear p.total').text(Object.keys(source_data.months).reduce(
                (sum, x) => sum + source_data.months[x].length
            , 0));

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
        this.jq.find('p.savePTO').on('click', function(event) {
            console.log(source_data);
            $.post( "/update", source_data, function( data ) {
                    console.log(data.response);
            });
        });
    }
    
}
},{"./holidayConfig.js":2}],2:[function(require,module,exports){
let config = {
  "January" : [2],
  "May" : [29],
  "July" : [4],
  "September" : [4],
  "November" : [23,24],
  "December" : [25]
};

module.exports = config;
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkY6XFxub2RlanNcXG5ld19leHByZXNzXFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL2Zha2VfMjVkZWFjMGIuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL2hvbGlkYXlDb25maWcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXHJcbiAqICBDcmVhdGVkIGJ5IHN0ZWYgb24gMTIvMjkvMjAxNi5cclxuICovXHJcbmxldCBjb25maWcgPSByZXF1aXJlKCcuL2hvbGlkYXlDb25maWcuanMnKTtcclxubGV0IHNvdXJjZV9kYXRhID0ge1xyXG4gICAgdXNlciA6ICcnLFxyXG4gICAgeWVhcjogJycsXHJcbiAgICBtb250aHM6IHt9XHJcbn07XHJcblxyXG5pZiAoIUFycmF5LnByb3RvdHlwZS5sYXN0KXtcclxuICAgIEFycmF5LnByb3RvdHlwZS5sYXN0ID0gZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gdGhpc1t0aGlzLmxlbmd0aCAtIDFdO1xyXG4gICAgfTtcclxufVxyXG5cclxuaWYgKCFBcnJheS5wcm90b3R5cGUucmVtb3ZlKXtcclxuICAgIEFycmF5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihyZW1vdmVkX2VsZW1lbnQpe1xyXG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBlbGVtZW50IG9mIHRoaXMpIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1lbnQgIT0gcmVtb3ZlZF9lbGVtZW50KSByZXN1bHQucHVzaChlbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH07XHJcbn1cclxuXHJcbi8vIC0tLS0tLS0tLS0gbWFpbiAtLS0tLS0tLS0tLVxyXG5cclxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XHJcbiAgICBsZXQgaGVhZGVyID0gbmV3IEhlYWRlcigpO1xyXG5cclxuICAgIGxldCBsb2dJbiA9IG5ldyBMb2dJbigpO1xyXG4gICAgbG9nSW4uc2VuZF9pbnB1dF90ZXh0KGhlYWRlcik7XHJcbiAgICAvL2xvZ0luLmpxLmhpZGUoKTtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vbigndXNlcl95ZWFyX3NldCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHNvdXJjZV9kYXRhKTtcclxuICAgICAgICBsZXQgcGFuZWwgPSBuZXcgUGFuZWwoc291cmNlX2RhdGEueWVhcik7XHJcbiAgICAgICAgcGFuZWwuZGF5cy5zZWxlY3RfaW50ZXJ2YWwoKTtcclxuICAgIFxyXG4gICAgICAgIGxldCBkaXNwbGF5SW50ZXJ2YWxzID0gbmV3IERpc3BsYXlJbnRlcnZhbHMoc291cmNlX2RhdGEudXNlciwgc291cmNlX2RhdGEueWVhcik7XHJcbiAgICAgICAgcGFuZWwuZGF5cy5zYXZlX2ludGVydmFsKGRpc3BsYXlJbnRlcnZhbHMpO1xyXG4gICAgfSk7XHJcblxyXG59KTtcclxuXHJcbi8vIC0tLS0tLS0tLS0gbWFpbiAtLS0tLS0tLS0tLVxyXG5cclxuY2xhc3MgSGVhZGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgICB0aGlzLmpxID0gJCgnZGl2LmhlYWRlcicpO1xyXG4gICAgICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy5qcS5maW5kKCdzcGFuJykudGV4dCgpO1xyXG4gICAgXHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICBzZXRfdXNlcih1c2VyX25hbWUpIHtcclxuICAgICAgICAgICAgLy90aGlzLnVzZXIgPSB1c2VyX25hbWU7XHJcbiAgICAgICAgICAgIHRoaXMuanEuZmluZCgncCcpLnRleHQodXNlcl9uYW1lKTtcclxuICAgICAgICAgICAgLy90aGlzLmpxLmZpbmQoJ2Rpdi51c2VyJykucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgIHNldF95ZWFyKHllYXIpIHtcclxuICAgIFxyXG4gICAgICAgICAgICBpZiAoLyAtIFxcZHs0fS8udGVzdCh0aGlzLnRpdGxlKSl7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh5ZWFyKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudGl0bGUgPSB0aGlzLnRpdGxlLnJlcGxhY2UoL1xcZHs0fS8sIHllYXIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMudGl0bGUgKyAnIC0gJyArIHllYXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ3NwYW4nKS50ZXh0KHRoaXMudGl0bGUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuY2xhc3MgTG9nSW4ge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5sb2dfaW4nKTtcclxuICAgICAgICB0aGlzLm1lc3NhZ2UgPSAnTG9nIGluIHdpdGggZW1haWwnO1xyXG4gICAgICAgIHRoaXMudXNlciA9ICcnO1xyXG4gICAgfVxyXG5cclxuICAgIHNldF9tZXNzYWplKG1lc3NhamUpIHtcclxuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWplO1xyXG4gICAgICAgIHRoaXMuanEuZmluZCgncCcpLnRleHQodGhpcy5tZXNzYWdlKTtcclxuICAgIH1cclxuXHJcbiAgICBzZW5kX2lucHV0X3RleHQoaGVhZGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuanEuZmluZCgnaW5wdXQnKS5vbigna2V5cHJlc3MnLCAkLnByb3h5KCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5ID09ICdFbnRlcicgJiYgIXRoaXMudXNlcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VyID0gJChldmVudC5jdXJyZW50VGFyZ2V0KS52YWwoKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhoZWFkZXIpO1xyXG4gICAgICAgICAgICAgICAgaGVhZGVyLnNldF91c2VyKHRoaXMudXNlcik7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2VfZGF0YS51c2VyID0gdGhpcy51c2VyO1xyXG4gICAgICAgICAgICAgICAgaGVhZGVyLmpxLmZpbmQoJ2Rpdi51c2VyJykucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRfbWVzc2FqZSgnUGxlYXNlIGNob29zZSB5ZWFyJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2lucHV0JykudmFsKCcnKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5rZXkgPT0gJ0VudGVyJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy55ZWFyID0gJChldmVudC5jdXJyZW50VGFyZ2V0KS52YWwoKTtcclxuICAgICAgICAgICAgICAgIGlmICgvXlxcZHs0fSQvLnRlc3QodGhpcy55ZWFyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlci5zZXRfeWVhcih0aGlzLnllYXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuanEuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc291cmNlX2RhdGEueWVhciA9IHRoaXMueWVhcjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcigndXNlcl95ZWFyX3NldCcpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAkLmdldCggXCIvY2hlY2tfZGF0YVwiLCB7dXNlciA6IHRoaXMudXNlciwgeWVhcjogdGhpcy55ZWFyfSwgZnVuY3Rpb24oIGRhdGEgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc291cmNlX2RhdGEubW9udGhzID0gZGF0YS5yZXNwb25zZTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzb3VyY2VfZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgJCgnZGl2LmRpc3BsYXkgdGFibGUnKS50cmlnZ2VyKCdyZW5kZXJJbnRlcnZhbHMnKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCdkaXYuZGlzcGxheSB0YWJsZSB0Ym9keSB0cicpLmZpcnN0KCkudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBQYW5lbCB7XHJcbiAgICBjb25zdHJ1Y3Rvcih5ZWFyKSB7XHJcbiAgICAgICAgdGhpcy55ZWFyID0geWVhcjtcclxuICAgICAgICB0aGlzLmpxID0gJCgnZGl2Lm1haW4gZGl2LnBhbmVsJyk7XHJcbiAgICAgICAgdGhpcy5qcS5yZW1vdmVDbGFzcygnaGlkZScpO1xyXG4gICAgICAgIHRoaXMubW9udGggPSBuZXcgTW9udGgoKTtcclxuICAgICAgICB0aGlzLmRheXMgPSBuZXcgRGF5cyh0aGlzLm1vbnRoLm1vbnRoLCB5ZWFyKTtcclxuICAgICAgICB0aGlzLm1vbnRoLmNoYW5nZV9tb250aCh0aGlzLmRheXMpO1xyXG4gICAgICAgIHRoaXMubW9udGguY2hhbmdlX21vbnRoX3VwX2Rvd24oKTtcclxuICAgICAgICBcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgTW9udGgge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuY29sdW1ucyBkaXYubW9udGgnKTtcclxuICAgICAgICB0aGlzLm1vbnRoID0gdGhpcy5qcS5maW5kKCdwLm1vbnRoX3RleHQnKS50ZXh0KCk7XHJcbiAgICAgICAgdGhpcy5tb250aHNfaW5feWVhciA9IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5JywgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddO1xyXG4gICAgfVxyXG5cclxuICAgIHNldF9tb250aChtb250aCkge1xyXG4gICAgICAgIHRoaXMubW9udGggPSBtb250aDtcclxuICAgICAgICB0aGlzLmpxLmZpbmQoJ3AubW9udGhfdGV4dCcpLnRleHQobW9udGgpO1xyXG4gICAgfVxyXG5cclxuICAgIGNoYW5nZV9tb250aF91cF9kb3duKCkge1xyXG4gICAgICAgIHRoaXMuanEuZmluZCgncC51cCxwLmRvd24nKS5vbignY2xpY2snLCAkLnByb3h5KGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubW9udGhzX2luX3llYXIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1vbnRoID09IHRoaXMubW9udGhzX2luX3llYXJbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dF9tb250aCA9ICh0aGlzLm1vbnRoc19pbl95ZWFyW2kgKyAxXSB8fCB0aGlzLm1vbnRoc19pbl95ZWFyWzBdKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcHJldmlvdXNfbW9udGggPSAodGhpcy5tb250aHNfaW5feWVhcltpIC0gMV0gfHwgdGhpcy5tb250aHNfaW5feWVhci5sYXN0KCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmhhc0NsYXNzKCd1cCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0X21vbnRoKG5leHRfbW9udGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0X21vbnRoKHByZXZpb3VzX21vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5qcS5maW5kKCdwLm1vbnRoX3RleHQnKS50cmlnZ2VyKCdtb250aF9jaGFuZ2VkJywgdGhpcy5tb250aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIGNoYW5nZV9tb250aChkYXlzKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdwLm1vbnRoX3RleHQnKS5vbignbW9udGhfY2hhbmdlZCcsICQucHJveHkoZnVuY3Rpb24gKGV2ZW50LCBtb250aCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldF9tb250aChtb250aCk7XHJcbiAgICAgICAgICAgIGRheXMuanEudHJpZ2dlcignbW9udGhfY2hhbmdlZCcsIHRoaXMubW9udGgpO1xyXG4gICAgICAgIH0sdGhpcykpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBEYXlzIHtcclxuICAgIGNvbnN0cnVjdG9yKG1vbnRoLCB5ZWFyKSB7XHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuY29sdW1ucyBkaXYuZGF5cycpO1xyXG5cclxuICAgICAgICB0aGlzLm1vbnRoID0gbW9udGg7XHJcbiAgICAgICAgdGhpcy55ZWFyID0geWVhcjtcclxuICAgICAgICB0aGlzLmRheXMgPSBbXTtcclxuICAgICAgICB0aGlzLmRheXNfbmFtZXMgPSBbJ00nLCAnVCcsICdXJywgJ1QnLCAnRicsICdTJywgJ1MnXTtcclxuICAgICAgICB0aGlzLnRvdGFsX2RheXMgPSAnJztcclxuICAgICAgICB0aGlzLmRheXNfc2VsZWN0ZWQgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0X2RheXMoKTtcclxuICAgICAgICB0aGlzLmNoYW5nZV9kYXlzKCk7XHJcbiAgICAgICAgdGhpcy5jbGVhcigpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBpbml0X2RheXMoKSB7XHJcbiAgICAgICAgdGhpcy50b3RhbF9kYXlzID0gbW9tZW50KHRoaXMueWVhciArICcgJyArIHRoaXMubW9udGgsIFwiWVlZWSBNTU1NXCIpLmRheXNJbk1vbnRoKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGRheV9uciA9IDE7IGRheV9uciA8PSB0aGlzLnRvdGFsX2RheXM7IGRheV9ucisrKSB7XHJcbiAgICAgICAgICAgIGxldCBkYXkgPSB0aGlzLmNyZWF0ZV9tb250aF9kYXkoZGF5X25yKTtcclxuICAgICAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYuY2FsZW5kYXInKS5hcHBlbmQoZGF5LmpxKTtcclxuICAgICAgICAgICAgdGhpcy5kYXlzLnB1c2goZGF5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGZpcnN0X2RheSA9IHRoaXMuZGF5c1swXS5kYXlfb2Zfd2VlaztcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA2IC0gZmlyc3RfZGF5OyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGZpbGxfZGF5X3ByZXBwZW5kID0gdGhpcy5jcmVhdGVfbW9udGhfZGF5KDAsIDEpO1xyXG4gICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5jYWxlbmRhcicpLnByZXBlbmQoZmlsbF9kYXlfcHJlcHBlbmQuanEpO1xyXG4gICAgICAgICAgICB0aGlzLmRheXMudW5zaGlmdChmaWxsX2RheV9wcmVwcGVuZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gNjsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYuY2FsZW5kYXInKS5wcmVwZW5kKGA8cCBjbGFzcz1cImRheXNfbmFtZVwiPiR7dGhpcy5kYXlzX25hbWVzW2ldfTwvcD5gKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlX21vbnRoX2RheShkYXlfbnIsIGZpbGwpIHtcclxuICAgICAgICBsZXQgZGF5ID0ge1xyXG4gICAgICAgICAgICBuciA6ICcnLFxyXG4gICAgICAgICAgICBkYXlfb2Zfd2VlayA6ICcnLFxyXG4gICAgICAgICAgICBqcSA6ICQoJzxwPjwvcD4nKSxcclxuICAgICAgICAgICAgdHlwZSA6ICcnXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRfZGF5KGRheSwgZGF5X25yLCBmaWxsKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGRheTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRfZGF5KGRheSwgZGF5X25yLCBmaWxsKSB7XHJcbiAgICAgICAgZGF5LmpxLnJlbW92ZUNsYXNzKCdmaWxsJyk7XHJcbiAgICAgICAgZGF5LmpxLnJlbW92ZUNsYXNzKCdzdGF0ZV9ob2xpZGF5Jyk7XHJcblxyXG4gICAgICAgIGRheS5qcS5yZW1vdmVDbGFzcygnd2Vla2VuZCcpO1xyXG4gICAgICAgIGlmIChmaWxsKSB7XHJcbiAgICAgICAgICAgIGRheS5uciA9IGRheV9ucjtcclxuICAgICAgICAgICAgZGF5LmRheV9vZl93ZWVrID0gLTE7XHJcbiAgICAgICAgICAgIGRheS5qcS50ZXh0KCcnKTtcclxuICAgICAgICAgICAgZGF5LnR5cGUgPSdmaWxsJztcclxuICAgICAgICAgICAgZGF5LmpxLmFkZENsYXNzKCdmaWxsJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZGF5Lm5yID0gZGF5X25yO1xyXG4gICAgICAgICAgICBkYXkuZGF5X29mX3dlZWsgPSAgbW9tZW50KHRoaXMueWVhciArICcgJyArIHRoaXMubW9udGggKyAnICcgKyBkYXlfbnIsIFwiWVlZWSBNTU1NIEREXCIpLmRheSgpO1xyXG4gICAgICAgICAgICBkYXkuanEudGV4dChkYXkubnIpO1xyXG4gICAgICAgICAgICBkYXkudHlwZSA9IGRheS5kYXlfb2Zfd2VlayA9PSAwIHx8IGRheS5kYXlfb2Zfd2VlayA9PSA2ID8gJ3dlZWtlbmQnIDogJ25vcm1hbCc7XHJcblxyXG4gICAgICAgICAgICBkYXkudHlwZSA9IGNvbmZpZ1t0aGlzLm1vbnRoXSAmJiBjb25maWdbdGhpcy5tb250aF0uZmlsdGVyKCh4KSA9PiB4ID09IGRheS5ucikubGVuZ3RoID8gJ3N0YXRlX2hvbGlkYXknIDogZGF5LnR5cGU7XHJcbiAgICAgICAgICAgIGlmIChkYXkudHlwZSA9PSAnd2Vla2VuZCcpIGRheS5qcS5hZGRDbGFzcygnd2Vla2VuZCcpO1xyXG4gICAgICAgICAgICBpZiAoZGF5LnR5cGUgPT0gJ3N0YXRlX2hvbGlkYXknKSBkYXkuanEuYWRkQ2xhc3MoJ3N0YXRlX2hvbGlkYXknKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNoYW5nZV9kYXlzKCkge1xyXG4gICAgICAgIHRoaXMuanEub24oJ21vbnRoX2NoYW5nZWQnLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50LCBtb250aCkge1xyXG4gICAgICAgICAgICB0aGlzLmNsZWFyX3NlbGVjdCgpO1xyXG4gICAgICAgICAgICB0aGlzLm1vbnRoID0gbW9udGg7XHJcbiAgICAgICAgICAgIHRoaXMudG90YWxfZGF5cyA9IG1vbWVudCh0aGlzLnllYXIgKyAnICcgKyB0aGlzLm1vbnRoLCBcIllZWVkgTU1NTVwiKS5kYXlzSW5Nb250aCgpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGZpcnN0X3dlZWtfZGF5ID0gbW9tZW50KHRoaXMueWVhciArICcgJyArIHRoaXMubW9udGggKyAnICcgKyAxLCBcIllZWVkgTU1NTSBERFwiKS5kYXkoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCB0b3RhbF9mb3JfbGVuZ2h0ID0gdGhpcy50b3RhbF9kYXlzICsgKGZpcnN0X3dlZWtfZGF5ID09IDAgPyA2IDogZmlyc3Rfd2Vla19kYXkgLSAxKTtcclxuICAgICAgICAgICAgdG90YWxfZm9yX2xlbmdodCA9IHRvdGFsX2Zvcl9sZW5naHQgPiB0aGlzLmRheXMubGVuZ3RoID8gdG90YWxfZm9yX2xlbmdodCA6IHRoaXMuZGF5cy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGxldCBjdXJyZW50X21tb250aF9kYXlfbnIgPSAxO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbF9mb3JfbGVuZ2h0OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmRheXNbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoKGZpcnN0X3dlZWtfZGF5ID09IDAgJiYgaSA8IDYpIHx8IChmaXJzdF93ZWVrX2RheSA+IGkgKyAxKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldF9kYXkodGhpcy5kYXlzW2ldLCAwLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRfbW1vbnRoX2RheV9uciA8PSB0aGlzLnRvdGFsX2RheXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRfZGF5KHRoaXMuZGF5c1tpXSwgY3VycmVudF9tbW9udGhfZGF5X25yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudF9tbW9udGhfZGF5X25yKys7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXlzW2ldLmpxLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRheXNbaV0gPSAnJztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBkYXkgPSB0aGlzLmNyZWF0ZV9tb250aF9kYXkoY3VycmVudF9tbW9udGhfZGF5X25yKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5jYWxlbmRhcicpLmFwcGVuZChkYXkuanEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF5cy5wdXNoKGRheSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudF9tbW9udGhfZGF5X25yKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kYXlzID0gdGhpcy5kYXlzLmZpbHRlcigoeCkgPT4geCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnByZXNlbGVjdCgpO1xyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBzZWxlY3RfaW50ZXJ2YWwoKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYuY2FsZW5kYXInKS5vbignY2xpY2snLCAncCcsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgICBsZXQgZGF5ID0gJChldmVudC5jdXJyZW50VGFyZ2V0KTtcclxuICAgICAgICAgICAgbGV0IHRvdGFsRGlzcGxheSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYgZGl2Lm1vbnRoIGRpdi50b3RhbCBwJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGF5Lmhhc0NsYXNzKCdkYXlfc2VsZWN0ZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXlzX3NlbGVjdGVkID0gdGhpcy5kYXlzX3NlbGVjdGVkLnJlbW92ZShkYXkudGV4dCgpKTtcclxuICAgICAgICAgICAgICAgIHRvdGFsRGlzcGxheS50ZXh0KE51bWJlcih0b3RhbERpc3BsYXkudGV4dCgpKSAtIDEpO1xyXG5cclxuICAgICAgICAgICAgICAgIGRheS5yZW1vdmVDbGFzcygnZGF5X3NlbGVjdGVkJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF5Lmhhc0NsYXNzKCcnKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXlzX3NlbGVjdGVkLnB1c2goTnVtYmVyKGRheS50ZXh0KCkpKTtcclxuICAgICAgICAgICAgICAgIHRvdGFsRGlzcGxheS50ZXh0KE51bWJlcih0b3RhbERpc3BsYXkudGV4dCgpKSArIDEpO1xyXG5cclxuICAgICAgICAgICAgICAgIGRheS5hZGRDbGFzcygnZGF5X3NlbGVjdGVkJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzKSk7XHJcblxyXG4gICAgICAgIHRoaXMucHJlc2VsZWN0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJlc2VsZWN0KCkge1xyXG4gICAgICAgIGlmKHNvdXJjZV9kYXRhLm1vbnRoc1t0aGlzLm1vbnRoXSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBkYXlfc2VsZWN0ZWQgb2Ygc291cmNlX2RhdGEubW9udGhzW3RoaXMubW9udGhdKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBjdXJyZW50X2RheSBvZiB0aGlzLmRheXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudF9kYXkubnIgPT0gZGF5X3NlbGVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfZGF5LmpxLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGVhcigpIHtcclxuICAgICAgICAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2LmFjdGlvbnMgZGl2LmNsZWFyX3NlbGVjdGlvbicpLm9uKCdjbGljaycsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpcmVkJyk7XHJcbiAgICAgICAgICAgIHRoaXMuY2xlYXJfc2VsZWN0KCk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBzb3VyY2VfZGF0YS5tb250aHNbdGhpcy5tb250aF07XHJcbiAgICAgICAgICAgICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuZGlzcGxheSB0YWJsZScpLnRyaWdnZXIoJ3JlbmRlckludGVydmFscycpO1xyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhcl9zZWxlY3QoKSB7XHJcbiAgICAgICAgZm9yIChsZXQgZGF5IG9mIHRoaXMuZGF5cykge1xyXG4gICAgICAgICAgICBkYXkuanEucmVtb3ZlQ2xhc3MoJ2RheV9zZWxlY3RlZCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRheXNfc2VsZWN0ZWQgPSBbXTtcclxuICAgICAgICAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2IGRpdi5tb250aCBkaXYudG90YWwgcCcpLnRleHQoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZV9pbnRlcnZhbChkaXNwbGF5KSB7XHJcblxyXG4gICAgICAgIHRoaXMuanEucGFyZW50KCkuZmluZCgnZGl2LmFjdGlvbnMgZGl2LnNhdmVfaW50ZXJ2YWwnKS5vbignY2xpY2snLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmRheXNfc2VsZWN0ZWQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2VfZGF0YS5tb250aHNbdGhpcy5tb250aF0gPSB0aGlzLmRheXNfc2VsZWN0ZWQ7XHJcbiAgICAgICAgICAgICAgICBkaXNwbGF5LnRhYmxlLnRyaWdnZXIoJ3JlbmRlckludGVydmFscycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHNvdXJjZV9kYXRhKTtcclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5jbGFzcyBEaXNwbGF5SW50ZXJ2YWxzIHtcclxuICAgIGNvbnN0cnVjdG9yKHVzZXIsIHllYXIpIHtcclxuICAgICAgICB0aGlzLmpxID0gJCgnZGl2Lm1haW4gZGl2LnBhbmVsIGRpdi5kaXNwbGF5Jyk7XHJcbiAgICAgICAgdGhpcy5qcS5yZW1vdmVDbGFzcygnaGlkZScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMudGFibGUgPSB0aGlzLmpxLmZpbmQoJ3RhYmxlJyk7XHJcbiAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcclxuICAgICAgICB0aGlzLnllYXIgPSB5ZWFyO1xyXG4gICAgICAgIC8vdGhpcy5zYXZlX2RhdGEgPSB7fTtcclxuXHJcbiAgICAgICAgdGhpcy50b2dnbGVfcGFuZWwoKTtcclxuICAgICAgICB0aGlzLnJlbmRlcl9pbnRlcnZhbHMoKTtcclxuICAgICAgICB0aGlzLnNldF9wYW5lbF9tb250aCgpO1xyXG4gICAgICAgIHRoaXMuc2F2ZV9pbnRlcnZhbHMoKTtcclxuICAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICB0b2dnbGVfcGFuZWwoKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdwLnRpdGxlIHNwYW4nKS5vbignY2xpY2snLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuY29sdW1ucycpLnRvZ2dsZUNsYXNzKCdoaWRlJyk7XHJcbiAgICAgICAgICAgIHRoaXMuanEuZmluZCgncC5zYXZlUFRPJykudG9nZ2xlQ2xhc3MoJ2hpZGUnKTtcclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyX2ludGVydmFscygpIHtcclxuICAgICAgICB0aGlzLnRhYmxlLm9uKCdyZW5kZXJJbnRlcnZhbHMnLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coc291cmNlX2RhdGEubW9udGhzKTtcclxuICAgICAgICAgICAgdGhpcy50YWJsZS5maW5kKCd0Ym9keScpLmh0bWwoJycpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBtb250aCBpbiBzb3VyY2VfZGF0YS5tb250aHMpIHtcclxuICAgICAgICAgICAgICAgIGxldCByb3cgPSAkKCc8dHI+PC90cj4nKTtcclxuICAgICAgICAgICAgICAgIHJvdy5hcHBlbmQoYDx0ZD4ke21vbnRofTwvdGQ+YCk7XHJcbiAgICAgICAgICAgICAgICByb3cuYXBwZW5kKGA8dGQ+JHtzb3VyY2VfZGF0YS5tb250aHNbbW9udGhdLmpvaW4oJywnKX08L3RkPmApO1xyXG4gICAgICAgICAgICAgICAgcm93LmFwcGVuZChgPHRkPiR7c291cmNlX2RhdGEubW9udGhzW21vbnRoXS5sZW5ndGggfTwvdGQ+YCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy50YWJsZS5maW5kKCd0Ym9keScpLmFwcGVuZChyb3cpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhPYmplY3Qua2V5cyhzb3VyY2VfZGF0YS5tb250aHMpKTtcclxuICAgICAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYudG90YWxZZWFyIHAudG90YWwnKS50ZXh0KE9iamVjdC5rZXlzKHNvdXJjZV9kYXRhLm1vbnRocykucmVkdWNlKFxyXG4gICAgICAgICAgICAgICAgKHN1bSwgeCkgPT4gc3VtICsgc291cmNlX2RhdGEubW9udGhzW3hdLmxlbmd0aFxyXG4gICAgICAgICAgICAsIDApKTtcclxuXHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgICAgIHRoaXMudGFibGUudHJpZ2dlcigncmVuZGVySW50ZXJ2YWxzJyk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0X3BhbmVsX21vbnRoKCkge1xyXG4gICAgICAgIHRoaXMudGFibGUub24oJ2NsaWNrJywndHInLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzKTtcclxuICAgICAgICAgICBsZXQgbW9udGggPSAkKHRoaXMpLmZpbmQoJ3RkJykuZmlyc3QoKS50ZXh0KCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1vbnRoKTtcclxuICAgICAgICAgICAgJCgnZGl2Lm1vbnRoX2lucHV0IHAubW9udGhfdGV4dCcpLnRyaWdnZXIoJ21vbnRoX2NoYW5nZWQnLCBtb250aCk7XHJcblxyXG5cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzYXZlX2ludGVydmFscygpIHtcclxuICAgICAgICB0aGlzLmpxLmZpbmQoJ3Auc2F2ZVBUTycpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHNvdXJjZV9kYXRhKTtcclxuICAgICAgICAgICAgJC5wb3N0KCBcIi91cGRhdGVcIiwgc291cmNlX2RhdGEsIGZ1bmN0aW9uKCBkYXRhICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEucmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG59IiwibGV0IGNvbmZpZyA9IHtcclxuICBcIkphbnVhcnlcIiA6IFsyXSxcclxuICBcIk1heVwiIDogWzI5XSxcclxuICBcIkp1bHlcIiA6IFs0XSxcclxuICBcIlNlcHRlbWJlclwiIDogWzRdLFxyXG4gIFwiTm92ZW1iZXJcIiA6IFsyMywyNF0sXHJcbiAgXCJEZWNlbWJlclwiIDogWzI1XVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBjb25maWc7Il19
