class Db {
    constructor(mongodb) {
        this.connection = mongodb;
        this.stored_pto = this.connection.get('vc_intervals');
    }

    update_user_year(data) {
        let year = `years.${data.year}`;
        let query = {};
        query[year] = data.months;
        
        return this.stored_pto.update(
            {user: data.user},
            { $set : query },
            { upsert : true }
        );
    }
    
    find_user_year(user, year) {
        let year_q = `years.${year}`;
        let query = {};
        query[year_q] = 1;
        // console.log()

        return this.stored_pto.findOne({user: user}, { fields: query });
    }

    update_user_profile(data) {
        return this.stored_pto.update(
            {user: data.user},
            { 
                $set : {
                    profile : data.profile
                } 
            },
            { upsert : true }
        );
    }

    get_profile_data(user) {
        return this.stored_pto.findOne({user: user});
    }
}

module.exports = Db;


