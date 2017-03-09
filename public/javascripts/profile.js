let Header = require('./main_modules/Header.js');
let utils = require('./main_modules/Utils.js');

$(document).ready(function() {
    let user = utils.get_url_params('user');

    let header = new Header();
    header.set_user(user);
    
    let profile = new Profile(user);

});


class Profile {
    constructor(user) {
        this.user = user;
        console.log(this.user);

        this.jq = $('div.content');

        this.add_input_checking();
        this.save();
    }

    add_input_checking() {
        this.jq.find('input[regex]').on('keyup', function(event) {
            let regex_type = $(this).attr('regex');

            let regex;
            switch(regex_type) {
                case 'name':
                    regex = /^[a-zA-Z]+$/;
                    break;
                case 'nr':
                    regex = /^\d+$/;
                    break;
                case 'email':
                    regex = /^[\d@a-zA-Z\.]+$/;
                    break;
                case 'boss':
                    regex = /^[a-zA-Z ]+$/;
                    break;
            }
            
            if (regex) {
                if(!regex.test($(this).val())) {
                    $(this).val('');
                    utils.animate_wrong($(this));
                }
            }

        });
    }

    save() {
       this.jq.find('div.save').on('click', $.proxy(function(){
           console.log('prepare_data');
           $(event.currentTarget).addClass('check');
           setTimeout($.proxy(function(){
               this.removeClass('check');
           }, $(event.currentTarget)), 1500);

           let sendData = this.prepareData($(event.currentTarget));
           if (sendData) {
               let final_data = {
                user : this.user,
                profile : sendData  
               };
               console.log(final_data);
               this.sendData(final_data, $(event.currentTarget));
           }

       }, this)); 
    }

    prepareData(save_obj) {
        let data = {};

        this.jq.find('tbody tr').each(function(index){
            let key = $(this).find('td').first().text();
            let val = $(this).find('td:last-child input').val() || $(this).find('option:checked').val();

            if (key && val) {
                data[key] = val;
            } else {
                utils.animate_wrong($(this).find('td:last-child input'));
            }
        });

        if(Object.keys(data).length != 6) {
            save_obj.addClass('fail');
            setTimeout($.proxy(function(){
               this.removeClass('fail');
            }, save_obj), 2000);
            return 0;
        }

        return data;
    }

    sendData(data, save_obj) {
        utils.sendJson('/update_user_data', data)
            .then(function(res){console.log(res)}, 
            function(err){
                console.log(err);
                save_obj.addClass('fail');
                setTimeout($.proxy(function(){
                    this.removeClass('fail');
                }, save_obj), 2000);
            });
    }
}