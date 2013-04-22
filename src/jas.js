/*
    Jas是一个迷你的异步流工具
    基于信号量机制，可以用when/now两个操作来等待/释放信号量
    从而达到复杂的（非周期）异步流控制
*/
;define(function(require){
    var core = require('core');
    
    var uid = 1;
    var Jas = function(){
        this.map = {};
        this.rmap = {};
    };
    Jas.prototype = {
        when: function(resources, callback, thisObj){
            var me = this, map = me.map, rmap = me.rmap;
            if (typeof resources === 'string') resources = [resources];
            var id = (uid++).toString(16); // using hex
            map[id] = {
                waiting: core.clone(resources), // clone Array
                callback: callback,
                thisObj: thisObj || window
            };
            core.arrEach(resources, function(i, res){
                var list = rmap[res] || (rmap[res] = []);
                list.push(id);
            });
            return me;
        },
        now: function(resources){
            if (!resources) return this;
            var me = this, map = me.map, rmap = me.rmap;
            if (core.isS(resources)) resources = [resources];
            core.arrEach(resources, function(i, res){
                if (typeof rmap[res] === 'undefined') return;
                me._release(res, rmap[res]); // notify each callback waiting for this resource
                delete rmap[res]; // release this resource
            });
            return me;
        },
        _release: function(res, list){
            var map = this.map, rmap = this.rmap;
            core.arrEach(list, function(i, uid){
                var mapItem = map[uid], waiting = mapItem.waiting;
                core.arrRemove(waiting, res); // remove
                if (waiting.length === 0){ // no more depends
                    setTimeout(core.delegate(mapItem.callback, mapItem.thisObj), 0); // fire the callback asynchronously
                    delete map[uid];
                }
            });
        }
    };
    return Jas;
});