import { Room, Client } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";

export class Player extends Schema {
    @type("string")
    sessionId = "";

    @type("number")
    char_idx = 1;

    @type("number")
    panel_idx = -1;

    @type("number")
    x= Math.random();
    // x = Math.floor(Math.random() * 400);

    @type("number")
    y= Math.random();
    // y = Math.floor(Math.random() * 400);

    setPanelIdx(idx:number) {
        this.panel_idx = idx;
    }

    setSessionId(id:string) {
        this.sessionId = id;
    }
}

export class State extends Schema {
    @type({ map: Player })
    players = new MapSchema<Player>();

    something = "This attribute won't be sent to the client-side";

    createPlayer(sessionId: string, cnt_joined: number) {
        var new_player = new Player();
        let object_ids = [30,1,2,4,5,6,7,8,9,10,11]
        new_player.char_idx= object_ids[Math.floor(Math.random() * 12)%12];
        // new_player.char_idx= object_ids[6];
        // new_player.char_idx=1;
        new_player.setPanelIdx(cnt_joined-1);
        new_player.setSessionId(sessionId);
        this.players.set(sessionId ,new_player);
    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    movePlayer (sessionId: string, movement: any) {
        if (movement.x) {
            this.players.get(sessionId).x += movement.x * 10;

        } else if (movement.y) {
            this.players.get(sessionId).y += movement.y * 10;
        }
    }
}

export class StateHandlerRoom extends Room<State> {
    maxClients = 4;

    onCreate (options) {
        var that = this;
        console.log("StateHandlerRoom created!", options);

        this.setState(new State());
        this.onMessage("function", (client, data) => {
            for (const c of that.clients) {
                c.send("hello", "world");
            }
        });

        this.onMessage("key", (client, data)=>{
            // console.log(client.sessionId, data);
            for (const c of that.clients) {
                // console.log(c.sessionId);
                if(c.sessionId != client.sessionId) {
                    console.log(data);
                    c.send("key_control", {sessionId:client.sessionId, data});
                }
            }            
        });

        this.onMessage("move", (client, data) => {
            console.log("StateHandlerRoom received message from", client.sessionId, ":", data);
            // this.state.movePlayer(client.sessionId, data);
        });
    }

    onAuth(client, options, req) {
        return true;
    }

    onJoin (client: Client) {
        var cnt = this.clients.length;
        this.state.createPlayer(client.sessionId, cnt);
        var player = this.state.players.get(client.sessionId);
        client.send("joined", player);
        console.log('joined',client.sessionId);

    }

    onLeave (client) {
        this.state.removePlayer(client.sessionId);
    }

    onDispose () {
        console.log("Dispose StateHandlerRoom");
    }

}
