let utils = require('./Utils.js');

class LogIn {
    constructor(source_data) {
        this.source_data = source_data;
        this.jq = $('div.log_in');
        this.message = 'Type a user name';
        this.user = '';

        this.login();
    }

    set_messaje(messaje) {
        this.message = messaje;
        utils.random_text_change(this.jq.find('p').first(), messaje, 100);
    }

    login() {
        return this.jq.find('input').on('keypress', $.proxy( function(event) {
            if (event.key == 'Enter') {
                this.user = $(event.currentTarget).val();
                window.location.replace(`/?user=${this.user}`);

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