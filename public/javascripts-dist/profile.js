(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./main_modules/Header.js":2,"./main_modules/Utils.js":3}],2:[function(require,module,exports){
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
},{"./Utils.js":3}],3:[function(require,module,exports){
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
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkY6XFxub2RlanNcXG5ld19leHByZXNzXFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL2Zha2VfMTM1ZDQyODAuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL21haW5fbW9kdWxlcy9IZWFkZXIuanMiLCJGOi9ub2RlanMvbmV3X2V4cHJlc3MvcHVibGljL2phdmFzY3JpcHRzL21haW5fbW9kdWxlcy9VdGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibGV0IEhlYWRlciA9IHJlcXVpcmUoJy4vbWFpbl9tb2R1bGVzL0hlYWRlci5qcycpO1xyXG5sZXQgdXRpbHMgPSByZXF1aXJlKCcuL21haW5fbW9kdWxlcy9VdGlscy5qcycpO1xyXG5cclxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XHJcbiAgICBsZXQgdXNlciA9IHV0aWxzLmdldF91cmxfcGFyYW1zKCd1c2VyJyk7XHJcblxyXG4gICAgbGV0IGhlYWRlciA9IG5ldyBIZWFkZXIoKTtcclxuICAgIGhlYWRlci5zZXRfdXNlcih1c2VyKTtcclxuICAgIFxyXG4gICAgbGV0IHByb2ZpbGUgPSBuZXcgUHJvZmlsZSh1c2VyKTtcclxuXHJcbn0pO1xyXG5cclxuXHJcbmNsYXNzIFByb2ZpbGUge1xyXG4gICAgY29uc3RydWN0b3IodXNlcikge1xyXG4gICAgICAgIHRoaXMudXNlciA9IHVzZXI7XHJcbiAgICAgICAgY29uc29sZS5sb2codGhpcy51c2VyKTtcclxuXHJcbiAgICAgICAgdGhpcy5qcSA9ICQoJ2Rpdi5jb250ZW50Jyk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkX2lucHV0X2NoZWNraW5nKCk7XHJcbiAgICAgICAgdGhpcy5zYXZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkX2lucHV0X2NoZWNraW5nKCkge1xyXG4gICAgICAgIHRoaXMuanEuZmluZCgnaW5wdXRbcmVnZXhdJykub24oJ2tleXVwJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgbGV0IHJlZ2V4X3R5cGUgPSAkKHRoaXMpLmF0dHIoJ3JlZ2V4Jyk7XHJcblxyXG4gICAgICAgICAgICBsZXQgcmVnZXg7XHJcbiAgICAgICAgICAgIHN3aXRjaChyZWdleF90eXBlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICduYW1lJzpcclxuICAgICAgICAgICAgICAgICAgICByZWdleCA9IC9eW2EtekEtWl0rJC87XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICducic6XHJcbiAgICAgICAgICAgICAgICAgICAgcmVnZXggPSAvXlxcZCskLztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2VtYWlsJzpcclxuICAgICAgICAgICAgICAgICAgICByZWdleCA9IC9eW1xcZEBhLXpBLVpcXC5dKyQvO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYm9zcyc6XHJcbiAgICAgICAgICAgICAgICAgICAgcmVnZXggPSAvXlthLXpBLVogXSskLztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHJlZ2V4KSB7XHJcbiAgICAgICAgICAgICAgICBpZighcmVnZXgudGVzdCgkKHRoaXMpLnZhbCgpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykudmFsKCcnKTtcclxuICAgICAgICAgICAgICAgICAgICB1dGlscy5hbmltYXRlX3dyb25nKCQodGhpcykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmUoKSB7XHJcbiAgICAgICB0aGlzLmpxLmZpbmQoJ2Rpdi5zYXZlJykub24oJ2NsaWNrJywgJC5wcm94eShmdW5jdGlvbigpe1xyXG4gICAgICAgICAgIGNvbnNvbGUubG9nKCdwcmVwYXJlX2RhdGEnKTtcclxuICAgICAgICAgICAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmFkZENsYXNzKCdjaGVjaycpO1xyXG4gICAgICAgICAgIHNldFRpbWVvdXQoJC5wcm94eShmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKCdjaGVjaycpO1xyXG4gICAgICAgICAgIH0sICQoZXZlbnQuY3VycmVudFRhcmdldCkpLCAxNTAwKTtcclxuXHJcbiAgICAgICAgICAgbGV0IHNlbmREYXRhID0gdGhpcy5wcmVwYXJlRGF0YSgkKGV2ZW50LmN1cnJlbnRUYXJnZXQpKTtcclxuICAgICAgICAgICBpZiAoc2VuZERhdGEpIHtcclxuICAgICAgICAgICAgICAgbGV0IGZpbmFsX2RhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICB1c2VyIDogdGhpcy51c2VyLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZSA6IHNlbmREYXRhICBcclxuICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgY29uc29sZS5sb2coZmluYWxfZGF0YSk7XHJcbiAgICAgICAgICAgICAgIHRoaXMuc2VuZERhdGEoZmluYWxfZGF0YSwgJChldmVudC5jdXJyZW50VGFyZ2V0KSk7XHJcbiAgICAgICAgICAgfVxyXG5cclxuICAgICAgIH0sIHRoaXMpKTsgXHJcbiAgICB9XHJcblxyXG4gICAgcHJlcGFyZURhdGEoc2F2ZV9vYmopIHtcclxuICAgICAgICBsZXQgZGF0YSA9IHt9O1xyXG5cclxuICAgICAgICB0aGlzLmpxLmZpbmQoJ3Rib2R5IHRyJykuZWFjaChmdW5jdGlvbihpbmRleCl7XHJcbiAgICAgICAgICAgIGxldCBrZXkgPSAkKHRoaXMpLmZpbmQoJ3RkJykuZmlyc3QoKS50ZXh0KCk7XHJcbiAgICAgICAgICAgIGxldCB2YWwgPSAkKHRoaXMpLmZpbmQoJ3RkOmxhc3QtY2hpbGQgaW5wdXQnKS52YWwoKSB8fCAkKHRoaXMpLmZpbmQoJ29wdGlvbjpjaGVja2VkJykudmFsKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoa2V5ICYmIHZhbCkge1xyXG4gICAgICAgICAgICAgICAgZGF0YVtrZXldID0gdmFsO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdXRpbHMuYW5pbWF0ZV93cm9uZygkKHRoaXMpLmZpbmQoJ3RkOmxhc3QtY2hpbGQgaW5wdXQnKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYoT2JqZWN0LmtleXMoZGF0YSkubGVuZ3RoICE9IDYpIHtcclxuICAgICAgICAgICAgc2F2ZV9vYmouYWRkQ2xhc3MoJ2ZhaWwnKTtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgkLnByb3h5KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlQ2xhc3MoJ2ZhaWwnKTtcclxuICAgICAgICAgICAgfSwgc2F2ZV9vYmopLCAyMDAwKTtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBzZW5kRGF0YShkYXRhLCBzYXZlX29iaikge1xyXG4gICAgICAgIHV0aWxzLnNlbmRKc29uKCcvdXBkYXRlX3VzZXJfZGF0YScsIGRhdGEpXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcyl7Y29uc29sZS5sb2cocmVzKX0sIFxyXG4gICAgICAgICAgICBmdW5jdGlvbihlcnIpe1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgICAgIHNhdmVfb2JqLmFkZENsYXNzKCdmYWlsJyk7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCQucHJveHkoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKCdmYWlsJyk7XHJcbiAgICAgICAgICAgICAgICB9LCBzYXZlX29iaiksIDIwMDApO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxufSIsImxldCB1dGlscyA9IHJlcXVpcmUoJy4vVXRpbHMuanMnKTtcclxuXHJcbmNsYXNzIEhlYWRlciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmpxID0gJCgnZGl2LmhlYWRlcicpO1xyXG4gICAgICAgIHRoaXMudGl0bGUgPSB0aGlzLmpxLmZpbmQoJ3NwYW4nKS50ZXh0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0X3VzZXIodXNlcl9uYW1lKSB7XHJcbiAgICAgICAgdGhpcy5qcS5maW5kKCdkaXYudXNlcicpLmNzcygnb3BhY2l0eScsICcxJyk7XHJcbiAgICAgICAgdXRpbHMucmFuZG9tX3RleHRfY2hhbmdlKHRoaXMuanEuZmluZCgncCcpLmZpcnN0KCksIHVzZXJfbmFtZSwgMTAwKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2V0X3llYXIoeWVhcikge1xyXG5cclxuICAgICAgICBpZiAoLyAtIFxcZHs0fS8udGVzdCh0aGlzLnRpdGxlKSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHllYXIpO1xyXG4gICAgICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy50aXRsZS5yZXBsYWNlKC9cXGR7NH0vLCB5ZWFyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy50aXRsZSArICcgLSAnICsgeWVhcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHV0aWxzLnJhbmRvbV90ZXh0X2NoYW5nZSh0aGlzLmpxLmZpbmQoJ3NwYW4nKS5maXJzdCgpLCB0aGlzLnRpdGxlLCAxMDApO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEhlYWRlcjsiLCJtb2R1bGUuZXhwb3J0cy5yYW5kb21fdGV4dF9jaGFuZ2UgPSAgZnVuY3Rpb24gKGpxX29iaiwgdGV4dF9uZXcsIHRpbW1lcikge1xyXG5cclxuICAgIGxldCBbLHdpZHRoXSA9IC8oXFxkKykvLmV4ZWMoanFfb2JqLmNzcygnZm9udC1zaXplJykpO1xyXG5cclxuICAgIGxldCByYW5kb21fY2hhbmdlX3N0eWxlID0gJCgnPHN0eWxlIHR5cGU9XCJ0ZXh0L2Nzc1wiPjwvc3R5bGU+Jyk7XHJcbiAgICByYW5kb21fY2hhbmdlX3N0eWxlLnRleHQoXHJcbiAgICAgICAgJy5yYW5kb21fY2hhbmdlIHsgZGlzcGxheTppbmxpbmUtYmxvY2s7IG1pbi13aWR0aDogMHB4OyB0cmFuc2l0aW9uOiBhbGwgJyArIHRpbW1lciAvIDEwMDAgKyAnczt9ICcgK1xyXG4gICAgICAgICcucmFuZG9tX2NoYW5nZV9zcGFuX2hpZGUgeyBtaW4td2lkdGg6ICcgKyB3aWR0aC8yICsgJ3B4OyBvcGFjaXR5OjA7IH0gJyArXHJcbiAgICAgICAgJy5yYW5kb21fY2hhbmdlX3NwYW5fcmVtb3ZlIHsgbWluLXdpZHRoOiAnICsgd2lkdGgvMiArICdweDsgb3BhY2l0eTowOyB9J1xyXG4gICAgKTtcclxuICAgICQoJ2hlYWQnKS5wcmVwZW5kKHJhbmRvbV9jaGFuZ2Vfc3R5bGUpO1xyXG5cclxuICAgIGxldCBjaGFyc19uZXcgPSB0ZXh0X25ldy5zcGxpdCgnJyk7XHJcbiAgICBsZXQgY2hhcnNfb3JnID0ganFfb2JqLnRleHQoKS5zcGxpdCgnJyk7XHJcbiAgICBsZXQgbWF4X25yID0gY2hhcnNfbmV3Lmxlbmd0aCA+IGNoYXJzX29yZy5sZW5ndGggPyBjaGFyc19uZXcubGVuZ3RoIDogY2hhcnNfb3JnLmxlbmd0aDtcclxuXHJcbiAgICBqcV9vYmoudGV4dCgnJyk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1heF9ucjsgaSsrKSB7XHJcbiAgICAgICAgaWYgKGNoYXJzX29yZ1tpXSkge1xyXG4gICAgICAgICAgICBjaGFyc19vcmdbaV0gPSAkKGA8c3BhbiBjbGFzcz0ncmFuZG9tX2NoYW5nZSc+JHtjaGFyc19vcmdbaV19PC9zcGFuPmApO1xyXG4gICAgICAgICAgICBjaGFyc19vcmdbaV07XHJcbiAgICAgICAgICAgIGlmIChjaGFyc19vcmdbaV0udGV4dCgpID09ICcgJykge1xyXG4gICAgICAgICAgICAgICAgY2hhcnNfb3JnW2ldLmNzcygnbWluLXdpZHRoJywgd2lkdGgvMy0xICsgJ3B4Jyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY2hhcnNfb3JnW2ldID0gJChgPHNwYW4gY2xhc3M9J3JhbmRvbV9jaGFuZ2UnPjwvc3Bhbj5gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGpxX29iai5hcHBlbmQoY2hhcnNfb3JnW2ldKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgY291bnRlciA9IFsuLi5BcnJheShtYXhfbnIpLmtleXMoKV07XHJcblxyXG4gICAgY291bnRlci5zaHVmZmxlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGkgPSB0aGlzLmxlbmd0aCwgaiwgdGVtcDtcclxuICAgICAgICBpZiAoIGkgPT0gMCApIHJldHVybiB0aGlzO1xyXG4gICAgICAgIHdoaWxlICggLS1pICkge1xyXG4gICAgICAgICAgICBqID0gTWF0aC5mbG9vciggTWF0aC5yYW5kb20oKSAqICggaSArIDEgKSApO1xyXG4gICAgICAgICAgICB0ZW1wID0gdGhpc1tpXTtcclxuICAgICAgICAgICAgdGhpc1tpXSA9IHRoaXNbal07XHJcbiAgICAgICAgICAgIHRoaXNbal0gPSB0ZW1wO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgY291bnRlciA9IGNvdW50ZXIuc2h1ZmZsZSgpO1xyXG4gICAgbGV0IGluaXRpYWxfdGltZSA9IHRpbW1lcjtcclxuICAgIGZvciAobGV0IGluZGV4IG9mIGNvdW50ZXIpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGNoYXJzX29yZ1tpbmRleF0gIT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGNoYXJzX25ld1tpbmRleF0gIT0gJ3VuZGVmaW5lZCcpIHtcclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFyc19vcmdbaW5kZXhdLmFkZENsYXNzKCdyYW5kb21fY2hhbmdlX3NwYW5faGlkZScpO1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hhcnNfbmV3W2luZGV4XSA9PSAnICcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhcnNfb3JnW2luZGV4XS5jc3MoJ3dpZHRoJywgJzhweCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjaGFyc19vcmdbaW5kZXhdLnRleHQoY2hhcnNfbmV3W2luZGV4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhcnNfb3JnW2luZGV4XS5yZW1vdmVDbGFzcygncmFuZG9tX2NoYW5nZV9zcGFuX2hpZGUnKTtcclxuICAgICAgICAgICAgICAgIH0saW5pdGlhbF90aW1lKVxyXG5cclxuICAgICAgICAgICAgfSwgdGltbWVyKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY2hhcnNfbmV3W2luZGV4XSA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhcnNfb3JnW2luZGV4XS5hZGRDbGFzcygncmFuZG9tX2NoYW5nZV9zcGFuX3JlbW92ZScpO1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNoYXJzX29yZ1tpbmRleF0ucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICB9LCBpbml0aWFsX3RpbWUpO1xyXG4gICAgICAgICAgICB9LCB0aW1tZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGltbWVyICs9IGluaXRpYWxfdGltZTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGpxX29iai5odG1sKGpxX29iai50ZXh0KCkpO1xyXG4gICAgICAgIHJhbmRvbV9jaGFuZ2Vfc3R5bGUucmVtb3ZlKCk7XHJcblxyXG4gICAgfSwgaW5pdGlhbF90aW1lICsgdGltbWVyKTtcclxuXHJcbn1cclxuXHJcbmxldCBxdWVfc2luZ2xlX2NoYXIgPSBbXTtcclxubW9kdWxlLmV4cG9ydHMuY2hhbmdlX2NoYXJfbmljZSA9IGZ1bmN0aW9uKGpxX29iaiwgbmV3X3RleHQpIHtcclxuICAgIHF1ZV9zaW5nbGVfY2hhci5wdXNoKG5ld190ZXh0KTtcclxuICAgIGpxX29iai5yZW1vdmVDbGFzcygnc2luZ2xlX2NoYXJfY2hhbmdlJyk7XHJcbiAgICBqcV9vYmouYWRkQ2xhc3MoJ3NpbmdsZV9jaGFyX2NoYW5nZScpO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgIGpxX29iai50ZXh0KHF1ZV9zaW5nbGVfY2hhci5zaGlmdCgpKTtcclxuICAgIH0sIDI1MCk7XHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAganFfb2JqLnJlbW92ZUNsYXNzKCdzaW5nbGVfY2hhcl9jaGFuZ2UnKTtcclxuICAgIH0sIDYwMCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLmdldF91cmxfcGFyYW1zID0gZnVuY3Rpb24ocGFyYW0pIHtcclxuICAgIGxldCB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcclxuXHJcbiAgICBsZXQgcmVzdWx0ID0gbmV3IFJlZ0V4cCgnW1xcPyZdJyArIHBhcmFtICsgJz0oW14mI10qKScpLmV4ZWMod2luZG93LmxvY2F0aW9uLmhyZWYpO1xyXG4gICAgcmVzdWx0ID0gcmVzdWx0JiZyZXN1bHRbMV07XHJcbiAgICAvLyBpZighcmVzdWx0KSB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSgnLycpO1xyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLmFuaW1hdGVfd3JvbmcgPSBmdW5jdGlvbihqcV9vYmopIHtcclxuICAgIGpxX29iai5hZGRDbGFzcygnd3JvbmdfdmFsJyk7XHJcbiAgICBsZXQgYW5pbWF0aW9uX3RpbWUgPSBOdW1iZXIoLyhbXFxkXFwuXSspLy5leGVjKGpxX29iai5jc3MoJ2FuaW1hdGlvbicpKVsxXSk7XHJcbiAgICBzZXRUaW1lb3V0KCQucHJveHkoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVDbGFzcygnd3JvbmdfdmFsJyk7XHJcbiAgICB9LCBqcV9vYmopLCBhbmltYXRpb25fdGltZSAqIDEwMDApXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLnNlbmRKc29uID0gZnVuY3Rpb24odXJsLCBqc29uKSB7XHJcbiAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShqc29uKSxcclxuICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04JyxcclxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24obXNnKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKG1zZylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIHJlamVjdChFcnJvcihlcnIpKTtcclxuICAgICAgICB9KTtcclxuICAgfSk7XHJcbn0iXX0=
