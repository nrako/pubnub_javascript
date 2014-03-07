
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


presence_test = function(description, keyset, origin) {

    test(args.description,function(){
        expect(9);
        stop(7);
        var test_random_id = Date.now();
        var channelA = 'channel-A-' + test_random_id;
        var channelB = 'channel-B-' + test_random_id;
        var step = -1;

        listener = PUBNUB.init({
            'pubkey' : keysets[args.keyset]['pubKey'],
            'subkey' : keysets[args.keyset]['subKey'],
            'origin' : args.origin,
            'uuid'   : 'listener-' + test_random_id
        })
        actor = PUBNUB.init({t
            'pubkey' : keysets[args.keyset]['pubKey'],
            'subkey' : keysets[args.keyset]['subKey'],
            'origin' : origin,
            'ssl'    : false,
            'uuid'   : 'actor-' + test_random_id
        })

        listener.subscribe({
            channel : channelA + ',' + channelB,
            callback : console.log,
            presence : function(r,raw_data) {
                var channel = raw_data[2].split('-pnpres')[0];
                var action = r.action;
                var uuid = r.uuid;

                if (uuid == listener.get_uuid()) return;

                deepEqual(uuid,actor.get_uuid());

                console.log('STEP : ' + step + ', CHANNEL : ' + channel + ', ACTION : ' + action + ', UUID : ' + uuid);

                switch(step) {
                    case 0:
                    var check = args.check[0];


                        if (check["channelA"]) {
                            if (action in check["channelA"]) ok(true,"action in checks list");
                        }
                        if (check["channelB"]) {
                            if (action in check["channelA"]) ok(true,"action in checks list");
                        }

                        start();
                    break;
                    case 1:
                        if (channel == channelA) {
                            ok(action == "join" || action == "leave", "join and leave on A");
                            start();
                        } else {
                            deepEqual(action,"join");
                            start();
                        }
                    break;
                    case 2:
                        if (channel == channelA) {
                            deepEqual(action,"leave");
                            start();
                        } else {
                            ok(action == "join" || action == "leave", "join and leave on B");
                            start();
                        }
                    break;
                }
            }
        })

        setTimeout(function(){
            actor.subscribe({
                channel  : channelA,
                callback : console.log
            });
            step++;
        },5000);

        setTimeout(function(){
            actor.subscribe({
                channel  : channelB,
                callback : console.log
            });
            step++;
        }, 10000);


        setTimeout(function(){
            actor.unsubscribe({
                channel  : channelA
            });
            step++;
        }, 15000);

        setTimeout(function(){
            step++;
            listener.unsubscribe({
                channel : channelA
            });
            listener.unsubscribe({
                channel : channelB
            });
            actor.unsubscribe({
                channel : channelB
            });
        }, 25000);
    })
}

presence_test(
    description : "3.5 -> 3.5 Base Compatibility, SSL Off.",
    keyset      : "keyset1",
    origin      : "pubsub.pubnub.com",
    checks      :   [
                        { "channelA" : ["join"]},
                        { "channelB" : ["join"], "channelA"  : ["leave", "join"]},
                        { "channelA" : ["leave"], "channelB" : ["leave", "join"]}
                    ]

);
