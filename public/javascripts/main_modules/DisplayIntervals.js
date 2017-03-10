let utils = require('./Utils.js');

class DisplayIntervals {
    constructor(user, year, source_data) {
        this.source_data = source_data;

        this.jq = $('div.main div.panel div.display');
        this.jq.removeClass('hide');

        this.table = this.jq.find('table');
        this.user = user;
        this.year = year;
        this.totalDays = this.jq.find('div.total p.total').text();
        this.today = {
            day : Number(moment().format('DD')),
            month : Number(moment().format('MM')),
            year : Number(moment().format('YYYY')),
        };

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

                if (this.source_data.months) {
                    utils.change_char_nice(this.jq.find('div.totalYear p.total'), Object.keys(this.source_data.months).reduce(
                        (sum, x) => sum + this.source_data.months[x].length
                        , 0));

                    // console.log(this.totalDays);
                    let days_left = Object.keys(this.source_data.months).reduce(
                        (sum, x) => {
                            if(this.year == this.today.year) {
                                if (this.today.month == Number(moment(x, 'MMMM').format('MM'))) {
                                    return sum - this.source_data.months[x].reduce(
                                        (sum, x) => {
                                            if (Number(x) < this.today.day) {
                                                return sum + 1;
                                            }
                                            return sum;
                                        }
                                    , 0)
                                } else if (this.today.month > Number(moment(x, 'MMMM').format('MM'))) {
                                    return sum - this.source_data.months[x].length;     
                                }
                            }
                            return sum;
                        }
                    , this.totalDays);
                    utils.change_char_nice(this.jq.find('div.left p.total'), days_left); 
                    // console.log(days_left);
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