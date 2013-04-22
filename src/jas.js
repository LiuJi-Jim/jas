/*
    Jas是一个迷你的异步流工具
    基于信号量机制，可以用when/now两个操作来等待/释放信号量
    从而达到复杂的（非周期）异步流控制
*/
;(function(){
var uid = 1;
var Jas = function(){
    this.map = {};
    this.rmap = {};
};
var indexOf = Array.prototype.indexOf || function(obj){
    for (var i=0, len=this.length; i<len; ++i){
        if (this[i] === obj) return i;
    }
    return -1;
};
var fire = function(callback, thisObj){
    setTimeout(function(){
        callback.call(thisObj);
    }, 0);
};
Jas.prototype = {
    when: function(resources, callback, thisObj){
        var map = this.map, rmap = this.rmap;
        if (typeof resources === 'string') resources = [resources];
        var id = (uid++).toString(16); // using hex
        map[id] = {
            waiting: resources.slice(0), // clone Array
            callback: callback,
            thisObj: thisObj || window
        };
        
        for (var i=0, len=resources.length; i<len; ++i){
            var res = resources[i],
                list = rmap[res] || (rmap[res] = []);
            list.push(id);
        }
        return this;
    },
    trigger: function(resources){
        if (!resources) return this;
        var map = this.map, rmap = this.rmap;
        if (typeof resources === 'string') resources = [resources];
        for (var i=0, len=resources.length; i<len; ++i){
            var res = resources[i];
            if (typeof rmap[res] === 'undefined') continue;
            this._release(res, rmap[res]); // notify each callback waiting for this resource
            delete rmap[res]; // release this resource
        }
        return this;
    },
    _release: function(res, list){
        var map = this.map, rmap = this.rmap;
        for (var i=0, len=list.length; i<len; ++i){
            var uid = list[i], mapItem = map[uid], waiting = mapItem.waiting,
                pos = indexOf.call(waiting, res);
            waiting.splice(pos, 1); // remove
            if (waiting.length === 0){ // no more depends
                fire(mapItem.callback, mapItem.thisObj); // fire the callback asynchronously
                delete map[uid];
            }
        }
    }
};
window.Jas = Jas; // Jas is JavaScript Asynchronous (callings) Synchronizer
})();

/*

var flow = new Jas();
flow.when(['A', 'B'], function(){
    // both A and B are done!!
});

$.getJSON(url1, function(data){
    // An ajax request
    flow.trigger('A');
});
$.getJSON(url2', function(data){
    // Another ajax request
    flow.trigger('B');
});

*/