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
