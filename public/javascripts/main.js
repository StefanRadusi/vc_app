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