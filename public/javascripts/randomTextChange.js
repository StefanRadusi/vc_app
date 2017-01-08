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
