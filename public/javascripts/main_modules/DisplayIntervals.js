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