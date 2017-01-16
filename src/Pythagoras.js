import CanViewCallbacks from 'can-view-callbacks';
import CanStache from 'can-stache';
import assign from 'can-util/js/assign/';
import { interpolateViridis } from 'd3-scale';
import CanEvents from "can-util/dom/events/events";
import "can-util/dom/events/attributes/attributes";

Math.deg = function(radians) {
  return radians * (180 / Math.PI);
};

const memoizedCalc = function () {
    const memo = {};

    const key = ({ w, heightFactor, lean }) => [w,heightFactor, lean].join('-');

    return (args) => {
        const memoKey = key(args);

        if (memo[memoKey]) {
            return memo[memoKey];
        }else{
            const { w, heightFactor, lean } = args;

            const trigH = heightFactor*w;

            const result = {
                nextRight: Math.sqrt(trigH**2 + (w * (.5+lean))**2),
                nextLeft: Math.sqrt(trigH**2 + (w * (.5-lean))**2),
                nextYRight: -Math.sqrt(trigH**2 + (w * (.5+lean))**2),
                nextYLeft: -Math.sqrt(trigH**2 + (w * (.5-lean))**2),
                A: Math.deg(Math.atan(trigH / ((.5-lean) * w))),
                B: Math.deg(Math.atan(trigH / ((.5+lean) * w)))
            };

            memo[memoKey] = result;
            return result;
        }
    }
}();

const pythagorasTemplate = CanStache(`
    {{#recurrenceCheck}}
    <g transform="translate({{x}} {{y}}) {{rotate}}">
            <rect width="{{w}}" height="{{w}}"
                  x="0" y="0"
                  style="fill: {{interpolate}}" />

            <can-pythagoras w="{{nextLeft}}"
                        x="0" y="{{nextYLeft}}"
                        lvl="{{nextLvl}}" maxlvl="{{maxlvl}}"
                        height-factor="{{heightFactor}}"
                        lean="{{lean}}"
                        left="1" />
            <can-pythagoras w="{{nextRight}}"
                        x="{{nextX}}" y="{{nextYRight}}"
                        lvl={{nextLvl}} maxlvl="{{maxlvl}}"
                        height-factor="{{heightFactor}}"
                        lean="{{lean}}"
                        right="1" />

        </g>
    {{/recurrenceCheck}}`);

const Pythagoras = CanViewCallbacks.tag("can-pythagoras", function(el, tagData) {
    function redraw() {
        const opts = [].reduce.call(el.attributes, (o, a) => {o[a.name.replace(/-[a-z]/g, b => b[1].toUpperCase())]=+a.value;return o;}, {      
        });

        assign(opts, memoizedCalc(opts));

        assign(opts, {
            interpolate: interpolateViridis(opts.lvl / opts.maxlvl),
            nextLvl: +opts.lvl + 1,
            nextX: opts.w - opts.nextRight,
            recurrenceCheck: opts.lvl < opts.maxlvl && opts.w >= 1
        });

        if (opts.left) {
            opts.rotate = `rotate(${-opts.A} 0 ${opts.w})`;
        } else if (opts.right) {
            opts.rotate = `rotate(${opts.B} ${opts.w} ${opts.w})`;
        } else {
            opts.rotate = "";
        }

        if(tagData.old) {
            tagData.old.remove();
        }

        function attach() {        
            const node = el.parentNode;
            const frag = pythagorasTemplate(opts);
            tagData.old = frag.querySelector('g');
            tagData.ref = frag.querySelector('rect');
            node.appendChild(frag);
        }

        if(el.parentNode) {
            attach();
        } else {
            CanEvents.addEventListener.call(el, "inserted", attach);
        }
    }
    CanEvents.addEventListener.call(el, "attributes", function();
    redraw();
});

export default Pythagoras;
