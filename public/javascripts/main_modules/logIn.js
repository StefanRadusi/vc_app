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