(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 *  Created by stef on 12/29/2016.
 */
let config = require('./holidayConfig.js');
let awesome_text_change = require('./randomTextChange.js');

let source_data = {
    user : 'stef',
    year: '2017',
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

    $(document).on('user_year_set', function() {
        console.log(source_data);
        let panel = new Panel(source_data.year);
        panel.days.select_interval();
    
        let displayIntervals = new DisplayIntervals(source_data.user, source_data.year);
        panel.days.save_interval(displayIntervals);
    });


    //$(document).trigger('user_year_set');
});

// ---------- main -----------

class Header {
    constructor() {
        this.jq = $('div.header');
        this.title = this.jq.find('span').text();
    }
    
    set_user(user_name) {
        awesome_text_change.random(this.jq.find('p').first(), user_name, 100);
    }
    
    set_year(year) {
    
            if (/ - \d{4}/.test(this.title)){
                console.log(year);
                this.title = this.title.replace(/\d{4}/, year);
            } else {
                this.title = this.title + ' - ' + year;
            }

        awesome_text_change.random(this.jq.find('span').first(), this.title, 100);
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
        awesome_text_change.random(this.jq.find('p').first(), messaje, 100);
    }

    send_input_text(header) {
        return this.jq.find('input').on('keypress', $.proxy( function(event) {
            if (event.key == 'Enter' && !this.user) {
                this.user = $(event.currentTarget).val();

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
        awesome_text_change.random(this.jq.find('p.month_text').first(),month, 100);
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
            //day.jq.text('');
            change_char_nice(day.jq, '');
            day.type ='fill';
            day.jq.addClass('fill');
        } else {
            day.nr = day_nr;
            day.day_of_week =  moment(this.year + ' ' + this.month + ' ' + day_nr, "YYYY MMMM DD").day();
            //day.jq.text(day.nr);
            change_char_nice(day.jq, day.nr);
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
                change_char_nice(totalDisplay, Number(totalDisplay.text()) + 1);

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
        change_char_nice($('div.main div.panel div div.month div.total p'), 0);
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

            this.table.addClass('hide_for_render');
            setTimeout($.proxy(function(){

                this.table.find('tbody').html('');
                for (let month in source_data.months) {
                    let row = $('<tr></tr>');
                    row.append(`<td>${month}</td>`);
                    row.append(`<td>${source_data.months[month].join(',')}</td>`);
                    row.append(`<td>${source_data.months[month].length }</td>`);

                    this.table.find('tbody').append(row);
                }

                console.log(Object.keys(source_data.months));
                change_char_nice(this.jq.find('div.totalYear p.total'), Object.keys(source_data.months).reduce(
                    (sum, x) => sum + source_data.months[x].length
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
        this.jq.find('p.savePTO').on('click', function(event) {
            console.log(source_data);
            $.post( "/update", source_data, function( data ) {
                    console.log(data.response);
            });
        });
    }
    
}

function change_char_nice(jq_obj, new_text) {
    jq_obj.removeClass('single_char_change');
    jq_obj.addClass('single_char_change');
    setTimeout(function(){
        jq_obj.text(new_text);
    }, 250);

    setTimeout(function () {
        jq_obj.removeClass('single_char_change');
    }, 600);
}
},{"./holidayConfig.js":2,"./randomTextChange.js":3}],2:[function(require,module,exports){
let config = {
  "January" : [2],
  "May" : [29],
  "July" : [4],
  "September" : [4],
  "November" : [23,24],
  "December" : [25]
};

module.exports = config;
},{}],3:[function(require,module,exports){
module.exports.random =  function (jq_obj, text_new, timmer) {

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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkQ6XFxwcm9ncmFtbWluZ1xcbm9kZWpzXFx2Y19hcHBcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkQ6L3Byb2dyYW1taW5nL25vZGVqcy92Y19hcHAvcHVibGljL2phdmFzY3JpcHRzL2Zha2VfNjZiYmRkMWUuanMiLCJEOi9wcm9ncmFtbWluZy9ub2RlanMvdmNfYXBwL3B1YmxpYy9qYXZhc2NyaXB0cy9ob2xpZGF5Q29uZmlnLmpzIiwiRDovcHJvZ3JhbW1pbmcvbm9kZWpzL3ZjX2FwcC9wdWJsaWMvamF2YXNjcmlwdHMvcmFuZG9tVGV4dENoYW5nZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxyXG4gKiAgQ3JlYXRlZCBieSBzdGVmIG9uIDEyLzI5LzIwMTYuXHJcbiAqL1xyXG5sZXQgY29uZmlnID0gcmVxdWlyZSgnLi9ob2xpZGF5Q29uZmlnLmpzJyk7XHJcbmxldCBhd2Vzb21lX3RleHRfY2hhbmdlID0gcmVxdWlyZSgnLi9yYW5kb21UZXh0Q2hhbmdlLmpzJyk7XHJcblxyXG5sZXQgc291cmNlX2RhdGEgPSB7XHJcbiAgICB1c2VyIDogJ3N0ZWYnLFxyXG4gICAgeWVhcjogJzIwMTcnLFxyXG4gICAgbW9udGhzOiB7fVxyXG59O1xyXG5cclxuaWYgKCFBcnJheS5wcm90b3R5cGUubGFzdCl7XHJcbiAgICBBcnJheS5wcm90b3R5cGUubGFzdCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNbdGhpcy5sZW5ndGggLSAxXTtcclxuICAgIH07XHJcbn1cclxuXHJcbmlmICghQXJyYXkucHJvdG90eXBlLnJlbW92ZSl7XHJcbiAgICBBcnJheS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24ocmVtb3ZlZF9lbGVtZW50KXtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgZWxlbWVudCBvZiB0aGlzKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50ICE9IHJlbW92ZWRfZWxlbWVudCkgcmVzdWx0LnB1c2goZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9O1xyXG59XHJcblxyXG4vLyAtLS0tLS0tLS0tIG1haW4gLS0tLS0tLS0tLS1cclxuXHJcbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xyXG4gICAgbGV0IGhlYWRlciA9IG5ldyBIZWFkZXIoKTtcclxuXHJcbiAgICBsZXQgbG9nSW4gPSBuZXcgTG9nSW4oKTtcclxuICAgIGxvZ0luLnNlbmRfaW5wdXRfdGV4dChoZWFkZXIpO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9uKCd1c2VyX3llYXJfc2V0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coc291cmNlX2RhdGEpO1xyXG4gICAgICAgIGxldCBwYW5lbCA9IG5ldyBQYW5lbChzb3VyY2VfZGF0YS55ZWFyKTtcclxuICAgICAgICBwYW5lbC5kYXlzLnNlbGVjdF9pbnRlcnZhbCgpO1xyXG4gICAgXHJcbiAgICAgICAgbGV0IGRpc3BsYXlJbnRlcnZhbHMgPSBuZXcgRGlzcGxheUludGVydmFscyhzb3VyY2VfZGF0YS51c2VyLCBzb3VyY2VfZGF0YS55ZWFyKTtcclxuICAgICAgICBwYW5lbC5kYXlzLnNhdmVfaW50ZXJ2YWwoZGlzcGxheUludGVydmFscyk7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgLy8kKGRvY3VtZW50KS50cmlnZ2VyKCd1c2VyX3llYXJfc2V0Jyk7XHJcbn0pO1xyXG5cclxuLy8gLS0tLS0tLS0tLSBtYWluIC0tLS0tLS0tLS0tXHJcblxyXG5jbGFzcyBIZWFkZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5oZWFkZXInKTtcclxuICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy5qcS5maW5kKCdzcGFuJykudGV4dCgpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBzZXRfdXNlcih1c2VyX25hbWUpIHtcclxuICAgICAgICBhd2Vzb21lX3RleHRfY2hhbmdlLnJhbmRvbSh0aGlzLmpxLmZpbmQoJ3AnKS5maXJzdCgpLCB1c2VyX25hbWUsIDEwMCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHNldF95ZWFyKHllYXIpIHtcclxuICAgIFxyXG4gICAgICAgICAgICBpZiAoLyAtIFxcZHs0fS8udGVzdCh0aGlzLnRpdGxlKSl7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh5ZWFyKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudGl0bGUgPSB0aGlzLnRpdGxlLnJlcGxhY2UoL1xcZHs0fS8sIHllYXIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMudGl0bGUgKyAnIC0gJyArIHllYXI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdlc29tZV90ZXh0X2NoYW5nZS5yYW5kb20odGhpcy5qcS5maW5kKCdzcGFuJykuZmlyc3QoKSwgdGhpcy50aXRsZSwgMTAwKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmNsYXNzIExvZ0luIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuanEgPSAkKCdkaXYubG9nX2luJyk7XHJcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gJ0xvZyBpbiB3aXRoIGVtYWlsJztcclxuICAgICAgICB0aGlzLnVzZXIgPSAnJztcclxuICAgIH1cclxuXHJcbiAgICBzZXRfbWVzc2FqZShtZXNzYWplKSB7XHJcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FqZTtcclxuICAgICAgICBhd2Vzb21lX3RleHRfY2hhbmdlLnJhbmRvbSh0aGlzLmpxLmZpbmQoJ3AnKS5maXJzdCgpLCBtZXNzYWplLCAxMDApO1xyXG4gICAgfVxyXG5cclxuICAgIHNlbmRfaW5wdXRfdGV4dChoZWFkZXIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5qcS5maW5kKCdpbnB1dCcpLm9uKCdrZXlwcmVzcycsICQucHJveHkoIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC5rZXkgPT0gJ0VudGVyJyAmJiAhdGhpcy51c2VyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXIgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLnZhbCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGhlYWRlci5zZXRfdXNlcih0aGlzLnVzZXIpO1xyXG4gICAgICAgICAgICAgICAgc291cmNlX2RhdGEudXNlciA9IHRoaXMudXNlcjtcclxuICAgICAgICAgICAgICAgIGhlYWRlci5qcS5maW5kKCdkaXYudXNlcicpLnJlbW92ZUNsYXNzKCdoaWRlJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRfbWVzc2FqZSgnUGxlYXNlIGNob29zZSB5ZWFyJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2lucHV0JykudmFsKCcnKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5rZXkgPT0gJ0VudGVyJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy55ZWFyID0gJChldmVudC5jdXJyZW50VGFyZ2V0KS52YWwoKTtcclxuICAgICAgICAgICAgICAgIGlmICgvXlxcZHs0fSQvLnRlc3QodGhpcy55ZWFyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlci5zZXRfeWVhcih0aGlzLnllYXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuanEuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc291cmNlX2RhdGEueWVhciA9IHRoaXMueWVhcjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcigndXNlcl95ZWFyX3NldCcpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAkLmdldCggXCIvY2hlY2tfZGF0YVwiLCB7dXNlciA6IHRoaXMudXNlciwgeWVhcjogdGhpcy55ZWFyfSwgZnVuY3Rpb24oIGRhdGEgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc291cmNlX2RhdGEubW9udGhzID0gZGF0YS5yZXNwb25zZTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzb3VyY2VfZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgJCgnZGl2LmRpc3BsYXkgdGFibGUnKS50cmlnZ2VyKCdyZW5kZXJJbnRlcnZhbHMnKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCdkaXYuZGlzcGxheSB0YWJsZSB0Ym9keSB0cicpLmZpcnN0KCkudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBQYW5lbCB7XHJcbiAgICBjb25zdHJ1Y3Rvcih5ZWFyKSB7XHJcbiAgICAgICAgdGhpcy55ZWFyID0geWVhcjtcclxuICAgICAgICB0aGlzLmpxID0gJCgnZGl2Lm1haW4gZGl2LnBhbmVsJyk7XHJcbiAgICAgICAgdGhpcy5qcS5yZW1vdmVDbGFzcygnaGlkZScpO1xyXG4gICAgICAgIHRoaXMubW9udGggPSBuZXcgTW9udGgoKTtcclxuICAgICAgICB0aGlzLmRheXMgPSBuZXcgRGF5cyh0aGlzLm1vbnRoLm1vbnRoLCB5ZWFyKTtcclxuICAgICAgICB0aGlzLm1vbnRoLmNoYW5nZV9tb250aCh0aGlzLmRheXMpO1xyXG4gICAgICAgIHRoaXMubW9udGguY2hhbmdlX21vbnRoX3VwX2Rvd24oKTtcclxuICAgICAgICBcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgTW9udGgge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuY29sdW1ucyBkaXYubW9udGgnKTtcclxuICAgICAgICB0aGlzLm1vbnRoID0gdGhpcy5qcS5maW5kKCdwLm1vbnRoX3RleHQnKS50ZXh0KCk7XHJcbiAgICAgICAgdGhpcy5tb250aHNfaW5feWVhciA9IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5JywgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddO1xyXG4gICAgfVxyXG5cclxuICAgIHNldF9tb250aChtb250aCkge1xyXG4gICAgICAgIHRoaXMubW9udGggPSBtb250aDtcclxuICAgICAgICBhd2Vzb21lX3RleHRfY2hhbmdlLnJhbmRvbSh0aGlzLmpxLmZpbmQoJ3AubW9udGhfdGV4dCcpLmZpcnN0KCksbW9udGgsIDEwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgY2hhbmdlX21vbnRoX3VwX2Rvd24oKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdwLnVwLHAuZG93bicpLm9uKCdjbGljaycsICQucHJveHkoZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5tb250aHNfaW5feWVhci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW9udGggPT0gdGhpcy5tb250aHNfaW5feWVhcltpXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXh0X21vbnRoID0gKHRoaXMubW9udGhzX2luX3llYXJbaSArIDFdIHx8IHRoaXMubW9udGhzX2luX3llYXJbMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwcmV2aW91c19tb250aCA9ICh0aGlzLm1vbnRoc19pbl95ZWFyW2kgLSAxXSB8fCB0aGlzLm1vbnRoc19pbl95ZWFyLmxhc3QoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQoZXZlbnQuY3VycmVudFRhcmdldCkuaGFzQ2xhc3MoJ3VwJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRfbW9udGgobmV4dF9tb250aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRfbW9udGgocHJldmlvdXNfbW9udGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ3AubW9udGhfdGV4dCcpLnRyaWdnZXIoJ21vbnRoX2NoYW5nZWQnLCB0aGlzLm1vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2hhbmdlX21vbnRoKGRheXMpIHtcclxuICAgICAgICB0aGlzLmpxLmZpbmQoJ3AubW9udGhfdGV4dCcpLm9uKCdtb250aF9jaGFuZ2VkJywgJC5wcm94eShmdW5jdGlvbiAoZXZlbnQsIG1vbnRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0X21vbnRoKG1vbnRoKTtcclxuICAgICAgICAgICAgZGF5cy5qcS50cmlnZ2VyKCdtb250aF9jaGFuZ2VkJywgdGhpcy5tb250aCk7XHJcbiAgICAgICAgfSx0aGlzKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIERheXMge1xyXG4gICAgY29uc3RydWN0b3IobW9udGgsIHllYXIpIHtcclxuICAgICAgICB0aGlzLmpxID0gJCgnZGl2Lm1haW4gZGl2LnBhbmVsIGRpdi5jb2x1bW5zIGRpdi5kYXlzJyk7XHJcblxyXG4gICAgICAgIHRoaXMubW9udGggPSBtb250aDtcclxuICAgICAgICB0aGlzLnllYXIgPSB5ZWFyO1xyXG4gICAgICAgIHRoaXMuZGF5cyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZGF5c19uYW1lcyA9IFsnTScsICdUJywgJ1cnLCAnVCcsICdGJywgJ1MnLCAnUyddO1xyXG4gICAgICAgIHRoaXMudG90YWxfZGF5cyA9ICcnO1xyXG4gICAgICAgIHRoaXMuZGF5c19zZWxlY3RlZCA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmluaXRfZGF5cygpO1xyXG4gICAgICAgIHRoaXMuY2hhbmdlX2RheXMoKTtcclxuICAgICAgICB0aGlzLmNsZWFyKCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGluaXRfZGF5cygpIHtcclxuICAgICAgICB0aGlzLnRvdGFsX2RheXMgPSBtb21lbnQodGhpcy55ZWFyICsgJyAnICsgdGhpcy5tb250aCwgXCJZWVlZIE1NTU1cIikuZGF5c0luTW9udGgoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgZGF5X25yID0gMTsgZGF5X25yIDw9IHRoaXMudG90YWxfZGF5czsgZGF5X25yKyspIHtcclxuICAgICAgICAgICAgbGV0IGRheSA9IHRoaXMuY3JlYXRlX21vbnRoX2RheShkYXlfbnIpO1xyXG4gICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5jYWxlbmRhcicpLmFwcGVuZChkYXkuanEpO1xyXG4gICAgICAgICAgICB0aGlzLmRheXMucHVzaChkYXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgZmlyc3RfZGF5ID0gdGhpcy5kYXlzWzBdLmRheV9vZl93ZWVrO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDYgLSBmaXJzdF9kYXk7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgZmlsbF9kYXlfcHJlcHBlbmQgPSB0aGlzLmNyZWF0ZV9tb250aF9kYXkoMCwgMSk7XHJcbiAgICAgICAgICAgIHRoaXMuanEuZmluZCgnZGl2LmNhbGVuZGFyJykucHJlcGVuZChmaWxsX2RheV9wcmVwcGVuZC5qcSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF5cy51bnNoaWZ0KGZpbGxfZGF5X3ByZXBwZW5kKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSA2OyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5jYWxlbmRhcicpLnByZXBlbmQoYDxwIGNsYXNzPVwiZGF5c19uYW1lXCI+JHt0aGlzLmRheXNfbmFtZXNbaV19PC9wPmApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVfbW9udGhfZGF5KGRheV9uciwgZmlsbCkge1xyXG4gICAgICAgIGxldCBkYXkgPSB7XHJcbiAgICAgICAgICAgIG5yIDogJycsXHJcbiAgICAgICAgICAgIGRheV9vZl93ZWVrIDogJycsXHJcbiAgICAgICAgICAgIGpxIDogJCgnPHA+PC9wPicpLFxyXG4gICAgICAgICAgICB0eXBlIDogJydcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNldF9kYXkoZGF5LCBkYXlfbnIsIGZpbGwpO1xyXG5cclxuICAgICAgICByZXR1cm4gZGF5O1xyXG4gICAgfVxyXG5cclxuICAgIHNldF9kYXkoZGF5LCBkYXlfbnIsIGZpbGwpIHtcclxuICAgICAgICBkYXkuanEucmVtb3ZlQ2xhc3MoJ2ZpbGwnKTtcclxuICAgICAgICBkYXkuanEucmVtb3ZlQ2xhc3MoJ3N0YXRlX2hvbGlkYXknKTtcclxuXHJcbiAgICAgICAgZGF5LmpxLnJlbW92ZUNsYXNzKCd3ZWVrZW5kJyk7XHJcbiAgICAgICAgaWYgKGZpbGwpIHtcclxuICAgICAgICAgICAgZGF5Lm5yID0gZGF5X25yO1xyXG4gICAgICAgICAgICBkYXkuZGF5X29mX3dlZWsgPSAtMTtcclxuICAgICAgICAgICAgLy9kYXkuanEudGV4dCgnJyk7XHJcbiAgICAgICAgICAgIGNoYW5nZV9jaGFyX25pY2UoZGF5LmpxLCAnJyk7XHJcbiAgICAgICAgICAgIGRheS50eXBlID0nZmlsbCc7XHJcbiAgICAgICAgICAgIGRheS5qcS5hZGRDbGFzcygnZmlsbCcpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRheS5uciA9IGRheV9ucjtcclxuICAgICAgICAgICAgZGF5LmRheV9vZl93ZWVrID0gIG1vbWVudCh0aGlzLnllYXIgKyAnICcgKyB0aGlzLm1vbnRoICsgJyAnICsgZGF5X25yLCBcIllZWVkgTU1NTSBERFwiKS5kYXkoKTtcclxuICAgICAgICAgICAgLy9kYXkuanEudGV4dChkYXkubnIpO1xyXG4gICAgICAgICAgICBjaGFuZ2VfY2hhcl9uaWNlKGRheS5qcSwgZGF5Lm5yKTtcclxuICAgICAgICAgICAgZGF5LnR5cGUgPSBkYXkuZGF5X29mX3dlZWsgPT0gMCB8fCBkYXkuZGF5X29mX3dlZWsgPT0gNiA/ICd3ZWVrZW5kJyA6ICdub3JtYWwnO1xyXG5cclxuICAgICAgICAgICAgZGF5LnR5cGUgPSBjb25maWdbdGhpcy5tb250aF0gJiYgY29uZmlnW3RoaXMubW9udGhdLmZpbHRlcigoeCkgPT4geCA9PSBkYXkubnIpLmxlbmd0aCA/ICdzdGF0ZV9ob2xpZGF5JyA6IGRheS50eXBlO1xyXG4gICAgICAgICAgICBpZiAoZGF5LnR5cGUgPT0gJ3dlZWtlbmQnKSBkYXkuanEuYWRkQ2xhc3MoJ3dlZWtlbmQnKTtcclxuICAgICAgICAgICAgaWYgKGRheS50eXBlID09ICdzdGF0ZV9ob2xpZGF5JykgZGF5LmpxLmFkZENsYXNzKCdzdGF0ZV9ob2xpZGF5Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBjaGFuZ2VfZGF5cygpIHtcclxuICAgICAgICB0aGlzLmpxLm9uKCdtb250aF9jaGFuZ2VkJywgJC5wcm94eShmdW5jdGlvbihldmVudCwgbW9udGgpIHtcclxuICAgICAgICAgICAgdGhpcy5jbGVhcl9zZWxlY3QoKTtcclxuICAgICAgICAgICAgdGhpcy5tb250aCA9IG1vbnRoO1xyXG4gICAgICAgICAgICB0aGlzLnRvdGFsX2RheXMgPSBtb21lbnQodGhpcy55ZWFyICsgJyAnICsgdGhpcy5tb250aCwgXCJZWVlZIE1NTU1cIikuZGF5c0luTW9udGgoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBmaXJzdF93ZWVrX2RheSA9IG1vbWVudCh0aGlzLnllYXIgKyAnICcgKyB0aGlzLm1vbnRoICsgJyAnICsgMSwgXCJZWVlZIE1NTU0gRERcIikuZGF5KCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgdG90YWxfZm9yX2xlbmdodCA9IHRoaXMudG90YWxfZGF5cyArIChmaXJzdF93ZWVrX2RheSA9PSAwID8gNiA6IGZpcnN0X3dlZWtfZGF5IC0gMSk7XHJcbiAgICAgICAgICAgIHRvdGFsX2Zvcl9sZW5naHQgPSB0b3RhbF9mb3JfbGVuZ2h0ID4gdGhpcy5kYXlzLmxlbmd0aCA/IHRvdGFsX2Zvcl9sZW5naHQgOiB0aGlzLmRheXMubGVuZ3RoO1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudF9tbW9udGhfZGF5X25yID0gMTtcclxuXHJcbiAgICAgICAgICAgIGxldCB0aW1tZXIgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsX2Zvcl9sZW5naHQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgkLnByb3h5KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZGF5c1tpXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGZpcnN0X3dlZWtfZGF5ID09IDAgJiYgaSA8IDYpIHx8IChmaXJzdF93ZWVrX2RheSA+IGkgKyAxKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRfZGF5KHRoaXMuZGF5c1tpXSwgMCwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudF9tbW9udGhfZGF5X25yIDw9IHRoaXMudG90YWxfZGF5cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRfZGF5KHRoaXMuZGF5c1tpXSwgY3VycmVudF9tbW9udGhfZGF5X25yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfbW1vbnRoX2RheV9ucisrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXlzW2ldLmpxLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXlzW2ldID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZGF5ID0gdGhpcy5jcmVhdGVfbW9udGhfZGF5KGN1cnJlbnRfbW1vbnRoX2RheV9ucik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuanEuZmluZCgnZGl2LmNhbGVuZGFyJykuYXBwZW5kKGRheS5qcSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF5cy5wdXNoKGRheSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfbW1vbnRoX2RheV9ucisrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sIHRoaXMpLCB0aW1tZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRpbW1lciArPSA1MDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2V0VGltZW91dCgkLnByb3h5KGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXlzID0gdGhpcy5kYXlzLmZpbHRlcigoeCkgPT4geCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByZXNlbGVjdCgpO1xyXG4gICAgICAgICAgICB9LCB0aGlzKSwgdGltbWVyICsgNTAwKTtcclxuXHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHNlbGVjdF9pbnRlcnZhbCgpIHtcclxuICAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5jYWxlbmRhcicpLm9uKCdjbGljaycsICdwJywgJC5wcm94eShmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICAgIGxldCBkYXkgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xyXG4gICAgICAgICAgICBsZXQgdG90YWxEaXNwbGF5ID0gJCgnZGl2Lm1haW4gZGl2LnBhbmVsIGRpdiBkaXYubW9udGggZGl2LnRvdGFsIHAnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXkuaGFzQ2xhc3MoJ2RheV9zZWxlY3RlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRheXNfc2VsZWN0ZWQgPSB0aGlzLmRheXNfc2VsZWN0ZWQucmVtb3ZlKGRheS50ZXh0KCkpO1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlX2NoYXJfbmljZSh0b3RhbERpc3BsYXksIE51bWJlcih0b3RhbERpc3BsYXkudGV4dCgpKSAtMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZGF5LnJlbW92ZUNsYXNzKCdkYXlfc2VsZWN0ZWQnKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXkuaGFzQ2xhc3MoJycpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRheXNfc2VsZWN0ZWQucHVzaChOdW1iZXIoZGF5LnRleHQoKSkpO1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlX2NoYXJfbmljZSh0b3RhbERpc3BsYXksIE51bWJlcih0b3RhbERpc3BsYXkudGV4dCgpKSArIDEpO1xyXG5cclxuICAgICAgICAgICAgICAgIGRheS5hZGRDbGFzcygnZGF5X3NlbGVjdGVkJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzKSk7XHJcblxyXG4gICAgICAgIHRoaXMucHJlc2VsZWN0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJlc2VsZWN0KCkge1xyXG4gICAgICAgIGlmKHNvdXJjZV9kYXRhLm1vbnRoc1t0aGlzLm1vbnRoXSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBkYXlfc2VsZWN0ZWQgb2Ygc291cmNlX2RhdGEubW9udGhzW3RoaXMubW9udGhdKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBjdXJyZW50X2RheSBvZiB0aGlzLmRheXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudF9kYXkubnIgPT0gZGF5X3NlbGVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfZGF5LmpxLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGVhcigpIHtcclxuICAgICAgICAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2LmFjdGlvbnMgZGl2LmNsZWFyX3NlbGVjdGlvbicpLm9uKCdjbGljaycsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpcmVkJyk7XHJcbiAgICAgICAgICAgIHRoaXMuY2xlYXJfc2VsZWN0KCk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBzb3VyY2VfZGF0YS5tb250aHNbdGhpcy5tb250aF07XHJcbiAgICAgICAgICAgICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuZGlzcGxheSB0YWJsZScpLnRyaWdnZXIoJ3JlbmRlckludGVydmFscycpO1xyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhcl9zZWxlY3QoKSB7XHJcbiAgICAgICAgZm9yIChsZXQgZGF5IG9mIHRoaXMuZGF5cykge1xyXG4gICAgICAgICAgICBkYXkuanEucmVtb3ZlQ2xhc3MoJ2RheV9zZWxlY3RlZCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRheXNfc2VsZWN0ZWQgPSBbXTtcclxuICAgICAgICBjaGFuZ2VfY2hhcl9uaWNlKCQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYgZGl2Lm1vbnRoIGRpdi50b3RhbCBwJyksIDApO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmVfaW50ZXJ2YWwoZGlzcGxheSkge1xyXG5cclxuICAgICAgICB0aGlzLmpxLnBhcmVudCgpLmZpbmQoJ2Rpdi5hY3Rpb25zIGRpdi5zYXZlX2ludGVydmFsJykub24oJ2NsaWNrJywgJC5wcm94eShmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5kYXlzX3NlbGVjdGVkLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgc291cmNlX2RhdGEubW9udGhzW3RoaXMubW9udGhdID0gdGhpcy5kYXlzX3NlbGVjdGVkO1xyXG4gICAgICAgICAgICAgICAgZGlzcGxheS50YWJsZS50cmlnZ2VyKCdyZW5kZXJJbnRlcnZhbHMnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzb3VyY2VfZGF0YSk7XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuY2xhc3MgRGlzcGxheUludGVydmFscyB7XHJcbiAgICBjb25zdHJ1Y3Rvcih1c2VyLCB5ZWFyKSB7XHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5tYWluIGRpdi5wYW5lbCBkaXYuZGlzcGxheScpO1xyXG4gICAgICAgIHRoaXMuanEucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnRhYmxlID0gdGhpcy5qcS5maW5kKCd0YWJsZScpO1xyXG4gICAgICAgIHRoaXMudXNlciA9IHVzZXI7XHJcbiAgICAgICAgdGhpcy55ZWFyID0geWVhcjtcclxuICAgICAgICAvL3RoaXMuc2F2ZV9kYXRhID0ge307XHJcblxyXG4gICAgICAgIHRoaXMudG9nZ2xlX3BhbmVsKCk7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJfaW50ZXJ2YWxzKCk7XHJcbiAgICAgICAgdGhpcy5zZXRfcGFuZWxfbW9udGgoKTtcclxuICAgICAgICB0aGlzLnNhdmVfaW50ZXJ2YWxzKCk7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgdG9nZ2xlX3BhbmVsKCkge1xyXG4gICAgICAgIHRoaXMuanEuZmluZCgncC50aXRsZSBzcGFuJykub24oJ2NsaWNrJywgJC5wcm94eShmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICAkKCdkaXYubWFpbiBkaXYucGFuZWwgZGl2LmNvbHVtbnMnKS50b2dnbGVDbGFzcygnaGlkZScpO1xyXG4gICAgICAgICAgICB0aGlzLmpxLmZpbmQoJ3Auc2F2ZVBUTycpLnRvZ2dsZUNsYXNzKCdoaWRlJyk7XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcl9pbnRlcnZhbHMoKSB7XHJcbiAgICAgICAgdGhpcy50YWJsZS5vbigncmVuZGVySW50ZXJ2YWxzJywgJC5wcm94eShmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHNvdXJjZV9kYXRhLm1vbnRocyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRhYmxlLmFkZENsYXNzKCdoaWRlX2Zvcl9yZW5kZXInKTtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgkLnByb3h5KGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy50YWJsZS5maW5kKCd0Ym9keScpLmh0bWwoJycpO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbW9udGggaW4gc291cmNlX2RhdGEubW9udGhzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJvdyA9ICQoJzx0cj48L3RyPicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJvdy5hcHBlbmQoYDx0ZD4ke21vbnRofTwvdGQ+YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcm93LmFwcGVuZChgPHRkPiR7c291cmNlX2RhdGEubW9udGhzW21vbnRoXS5qb2luKCcsJyl9PC90ZD5gKTtcclxuICAgICAgICAgICAgICAgICAgICByb3cuYXBwZW5kKGA8dGQ+JHtzb3VyY2VfZGF0YS5tb250aHNbbW9udGhdLmxlbmd0aCB9PC90ZD5gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50YWJsZS5maW5kKCd0Ym9keScpLmFwcGVuZChyb3cpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5rZXlzKHNvdXJjZV9kYXRhLm1vbnRocykpO1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlX2NoYXJfbmljZSh0aGlzLmpxLmZpbmQoJ2Rpdi50b3RhbFllYXIgcC50b3RhbCcpLCBPYmplY3Qua2V5cyhzb3VyY2VfZGF0YS5tb250aHMpLnJlZHVjZShcclxuICAgICAgICAgICAgICAgICAgICAoc3VtLCB4KSA9PiBzdW0gKyBzb3VyY2VfZGF0YS5tb250aHNbeF0ubGVuZ3RoXHJcbiAgICAgICAgICAgICAgICAsIDApKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLnJlbW92ZUNsYXNzKCdoaWRlX2Zvcl9yZW5kZXInKTtcclxuICAgICAgICAgICAgfSwgdGhpcyksIDYwMCk7XHJcblxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgICAgICB0aGlzLnRhYmxlLnRyaWdnZXIoJ3JlbmRlckludGVydmFscycpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldF9wYW5lbF9tb250aCgpIHtcclxuICAgICAgICB0aGlzLnRhYmxlLm9uKCdjbGljaycsJ3RyJywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcyk7XHJcbiAgICAgICAgICAgbGV0IG1vbnRoID0gJCh0aGlzKS5maW5kKCd0ZCcpLmZpcnN0KCkudGV4dCgpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtb250aCk7XHJcbiAgICAgICAgICAgICQoJ2Rpdi5tb250aF9pbnB1dCBwLm1vbnRoX3RleHQnKS50cmlnZ2VyKCdtb250aF9jaGFuZ2VkJywgbW9udGgpO1xyXG5cclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZV9pbnRlcnZhbHMoKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdwLnNhdmVQVE8nKS5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzb3VyY2VfZGF0YSk7XHJcbiAgICAgICAgICAgICQucG9zdCggXCIvdXBkYXRlXCIsIHNvdXJjZV9kYXRhLCBmdW5jdGlvbiggZGF0YSApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhLnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxufVxyXG5cclxuZnVuY3Rpb24gY2hhbmdlX2NoYXJfbmljZShqcV9vYmosIG5ld190ZXh0KSB7XHJcbiAgICBqcV9vYmoucmVtb3ZlQ2xhc3MoJ3NpbmdsZV9jaGFyX2NoYW5nZScpO1xyXG4gICAganFfb2JqLmFkZENsYXNzKCdzaW5nbGVfY2hhcl9jaGFuZ2UnKTtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICBqcV9vYmoudGV4dChuZXdfdGV4dCk7XHJcbiAgICB9LCAyNTApO1xyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGpxX29iai5yZW1vdmVDbGFzcygnc2luZ2xlX2NoYXJfY2hhbmdlJyk7XHJcbiAgICB9LCA2MDApO1xyXG59IiwibGV0IGNvbmZpZyA9IHtcclxuICBcIkphbnVhcnlcIiA6IFsyXSxcclxuICBcIk1heVwiIDogWzI5XSxcclxuICBcIkp1bHlcIiA6IFs0XSxcclxuICBcIlNlcHRlbWJlclwiIDogWzRdLFxyXG4gIFwiTm92ZW1iZXJcIiA6IFsyMywyNF0sXHJcbiAgXCJEZWNlbWJlclwiIDogWzI1XVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBjb25maWc7IiwibW9kdWxlLmV4cG9ydHMucmFuZG9tID0gIGZ1bmN0aW9uIChqcV9vYmosIHRleHRfbmV3LCB0aW1tZXIpIHtcclxuXHJcbiAgICBsZXQgWyx3aWR0aF0gPSAvKFxcZCspLy5leGVjKGpxX29iai5jc3MoJ2ZvbnQtc2l6ZScpKTtcclxuXHJcbiAgICBsZXQgcmFuZG9tX2NoYW5nZV9zdHlsZSA9ICQoJzxzdHlsZSB0eXBlPVwidGV4dC9jc3NcIj48L3N0eWxlPicpO1xyXG4gICAgcmFuZG9tX2NoYW5nZV9zdHlsZS50ZXh0KFxyXG4gICAgICAgICcucmFuZG9tX2NoYW5nZSB7IGRpc3BsYXk6aW5saW5lLWJsb2NrOyBtaW4td2lkdGg6IDBweDsgdHJhbnNpdGlvbjogYWxsICcgKyB0aW1tZXIgLyAxMDAwICsgJ3M7fSAnICtcclxuICAgICAgICAnLnJhbmRvbV9jaGFuZ2Vfc3Bhbl9oaWRlIHsgbWluLXdpZHRoOiAnICsgd2lkdGgvMiArICdweDsgb3BhY2l0eTowOyB9ICcgK1xyXG4gICAgICAgICcucmFuZG9tX2NoYW5nZV9zcGFuX3JlbW92ZSB7IG1pbi13aWR0aDogJyArIHdpZHRoLzIgKyAncHg7IG9wYWNpdHk6MDsgfSdcclxuICAgICk7XHJcbiAgICAkKCdoZWFkJykucHJlcGVuZChyYW5kb21fY2hhbmdlX3N0eWxlKTtcclxuXHJcbiAgICBsZXQgY2hhcnNfbmV3ID0gdGV4dF9uZXcuc3BsaXQoJycpO1xyXG4gICAgbGV0IGNoYXJzX29yZyA9IGpxX29iai50ZXh0KCkuc3BsaXQoJycpO1xyXG4gICAgbGV0IG1heF9uciA9IGNoYXJzX25ldy5sZW5ndGggPiBjaGFyc19vcmcubGVuZ3RoID8gY2hhcnNfbmV3Lmxlbmd0aCA6IGNoYXJzX29yZy5sZW5ndGg7XHJcblxyXG4gICAganFfb2JqLnRleHQoJycpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXhfbnI7IGkrKykge1xyXG4gICAgICAgIGlmIChjaGFyc19vcmdbaV0pIHtcclxuICAgICAgICAgICAgY2hhcnNfb3JnW2ldID0gJChgPHNwYW4gY2xhc3M9J3JhbmRvbV9jaGFuZ2UnPiR7Y2hhcnNfb3JnW2ldfTwvc3Bhbj5gKTtcclxuICAgICAgICAgICAgY2hhcnNfb3JnW2ldO1xyXG4gICAgICAgICAgICBpZiAoY2hhcnNfb3JnW2ldLnRleHQoKSA9PSAnICcpIHtcclxuICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpXS5jc3MoJ21pbi13aWR0aCcsIHdpZHRoLzMtMSArICdweCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNoYXJzX29yZ1tpXSA9ICQoYDxzcGFuIGNsYXNzPSdyYW5kb21fY2hhbmdlJz48L3NwYW4+YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBqcV9vYmouYXBwZW5kKGNoYXJzX29yZ1tpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNvdW50ZXIgPSBbLi4uQXJyYXkobWF4X25yKS5rZXlzKCldO1xyXG5cclxuICAgIGNvdW50ZXIuc2h1ZmZsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpID0gdGhpcy5sZW5ndGgsIGosIHRlbXA7XHJcbiAgICAgICAgaWYgKCBpID09IDAgKSByZXR1cm4gdGhpcztcclxuICAgICAgICB3aGlsZSAoIC0taSApIHtcclxuICAgICAgICAgICAgaiA9IE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiAoIGkgKyAxICkgKTtcclxuICAgICAgICAgICAgdGVtcCA9IHRoaXNbaV07XHJcbiAgICAgICAgICAgIHRoaXNbaV0gPSB0aGlzW2pdO1xyXG4gICAgICAgICAgICB0aGlzW2pdID0gdGVtcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGNvdW50ZXIgPSBjb3VudGVyLnNodWZmbGUoKTtcclxuICAgIGxldCBpbml0aWFsX3RpbWUgPSB0aW1tZXI7XHJcbiAgICBmb3IgKGxldCBpbmRleCBvZiBjb3VudGVyKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjaGFyc19vcmdbaW5kZXhdICE9ICd1bmRlZmluZWQnICYmIHR5cGVvZiBjaGFyc19uZXdbaW5kZXhdICE9ICd1bmRlZmluZWQnKSB7XHJcblxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhcnNfb3JnW2luZGV4XS5hZGRDbGFzcygncmFuZG9tX2NoYW5nZV9zcGFuX2hpZGUnKTtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYXJzX25ld1tpbmRleF0gPT0gJyAnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0uY3NzKCd3aWR0aCcsICc4cHgnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhcnNfb3JnW2luZGV4XS50ZXh0KGNoYXJzX25ld1tpbmRleF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0ucmVtb3ZlQ2xhc3MoJ3JhbmRvbV9jaGFuZ2Vfc3Bhbl9oaWRlJyk7XHJcbiAgICAgICAgICAgICAgICB9LGluaXRpYWxfdGltZSlcclxuXHJcbiAgICAgICAgICAgIH0sIHRpbW1lcik7XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNoYXJzX25ld1tpbmRleF0gPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0uYWRkQ2xhc3MoJ3JhbmRvbV9jaGFuZ2Vfc3Bhbl9yZW1vdmUnKTtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICBjaGFyc19vcmdbaW5kZXhdLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSwgaW5pdGlhbF90aW1lKTtcclxuICAgICAgICAgICAgfSwgdGltbWVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRpbW1lciArPSBpbml0aWFsX3RpbWU7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICBqcV9vYmouaHRtbChqcV9vYmoudGV4dCgpKTtcclxuICAgICAgICByYW5kb21fY2hhbmdlX3N0eWxlLnJlbW92ZSgpO1xyXG5cclxuICAgIH0sIGluaXRpYWxfdGltZSArIHRpbW1lcik7XHJcblxyXG59XHJcbiJdfQ==
