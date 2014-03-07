
var uuid = Date.now()

var keysets = {

    "keyset1": {
        "pubKey": "pub-c-fb5fa283-0d93-424f-bf86-d9aca2366c86",
        "subKey": "sub-c-d247d250-9dbd-11e3-8008-02ee2ddab7fe",
        "secKey": "sec-c-MmI2YjRjODAtNWU5My00ZmZjLTg0MzUtZGM1NGExNjJkNjg1",
        "description": "Compatibility Mode ON"
    },

    "keyset2": {
        "pubKey": "pub-c-c9b0fe21-4ae1-433b-b766-62667cee65ef",
        "subKey": "sub-c-d91ee366-9dbd-11e3-a759-02ee2ddab7fe",
        "secKey": "sec-c-ZDUxZGEyNmItZjY4Ny00MjJmLWE0MjQtZTQyMDM0NTY2MDVk",
        "description": "Compatibility Mode OFF"
    }
};


function isInArray(array, search)
{
    return (array.indexOf(search) >= 0) ? true : false; 
}

presence_test = function(args) {

    test(args.description,function(){

        var count = 0;
        var a = args.checks;
        for ( var i in a) {
           for ( var j in a[i]) {
                count += a[i][j].length;
           }   
        }
        expect(count * 2 );
        stop(count);
        var test_random_id = Date.now();
        var channels = {
            "channelA" : 'channel-A-' + test_random_id ,
            "channelB" : 'channel-B-' + test_random_id
        };

        var step = -1;


        var listener = PUBNUB.init({
            'pubkey' : keysets[args.keyset]['pubKey'],
            'subkey' : keysets[args.keyset]['subKey'],
            'origin' : args.origin,
            'uuid'   : 'listener-' + test_random_id
        });
        var actor = PUBNUB.init({
            'pubkey' : keysets[args.keyset]['pubKey'],
            'subkey' : keysets[args.keyset]['subKey'],
            'origin' : args.origin,
            'ssl'    : args.ssl || false,
            'uuid'   : 'actor-' + test_random_id
        });

        listener.subscribe({
            channel : channels['channelA'] + ',' + channels['channelB'],
            callback : console.log,
            presence : function(r,raw_data) {
                var channel = raw_data[2].split('-pnpres')[0];
                var action = r.action;
                var uuid = r.uuid;

                if (uuid == listener.get_uuid()) return;

                deepEqual(uuid,actor.get_uuid());

                console.log('STEP : ' + step + ', CHANNEL : ' + channel + ', ACTION : ' + action + ', UUID : ' + uuid);

                var check = args.checks[step];

                if (channel == channels["channelA"] && check["channelA"]) {
                    if (isInArray(check["channelA"],action))
                        ok(true,"action in checks list");
                    else {
                        ok(false, "action not in checks list, " + ", STEP : " + step + " CHANNEL : " + channel + ", ACTION : " + action);
                    }
                }
                if (channel == channels["channelB"] && check["channelB"]) {
                    if (isInArray(check["channelB"],action))
                        ok(true,"action in checks list");                    
                    else {
                        ok(false, "action not in checks list, " + ", STEP : " + step + " CHANNEL : " + channel + ", ACTION : " + action);
                    }
                }
                start();
            }
                
        });

        setTimeout(function(){
            actor.subscribe({
                channel  : channels["channelA"],
                callback : console.log,
                error    : console.log
            });
            step++;
        },5000);

        setTimeout(function(){
            actor.subscribe({
                channel  : channels["channelB"],
                callback : console.log,
                error    : console.log
            });
            step++;
        }, 10000);


        setTimeout(function(){
            actor.unsubscribe({
                channel  : channels["channelA"]
            });
            step++;
        }, 15000);

        setTimeout(function(){
            step++;
            listener.unsubscribe({
                channel : channels["channelA"]
            });
            listener.unsubscribe({
                channel : channels["channelB"]
            });
            actor.unsubscribe({
                channel : channels["channelB"]
            });
        }, args.wait * 1000);
    })
}


presence_test({
    description : "3.5 -> 3.5 Base Compatibility, SSL Off.",
    keyset      : "keyset1",
    origin      : "pubsub.pubnub.com",
    checks      :   [
                        { "channelA" : ["join"]},
                        { "channelB" : ["join"], "channelA"  : ["leave", "join"]},
                        { "channelA" : ["leave"], "channelB" : ["leave", "join"]}
                    ],
    wait        : 120

});

//presence_test({
//    description : "TEST 2, 3.5 -> 3.5 SSL ON. Agnostic",
//    keyset      : "keyset1",
//    origin      : "pubsub.pubnub.com",
//    checks      :   [
//                        { "channelA" : ["join"]},
//                        { "channelB" : ["join"]},
//                        { "channelA" : ["timeout"]}
//                    ],
//    wait        : 660,
//    ssl         : true
//
//});

presence_test({
    description : "TEST 3, 3.5 -> 3.6 SSL ON, Compat On",
    keyset      : "keyset1",
    origin      : "presence-beta.pubnub.com",
    checks      :   [
        { "channelA" : ["join"]},
        { "channelB" : ["join"]},
        { "channelA" : ["timeout"]}
    ],
    wait        : 960,
    ssl         : true

});