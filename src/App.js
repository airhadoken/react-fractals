import CanComponent from 'can-component';
import CanSimpleMap from 'can-simple-map';
import CanStache from 'can-stache';
import assign from 'can-util/js/assign/';
import './App.css';
import { select as d3select, mouse as d3mouse } from 'd3-selection';
import { scaleLinear } from 'd3-scale';

import Pythagoras from './Pythagoras';


// borrowed from Vue fork https://github.com/yyx990803/vue-fractal/blob/master/src/App.vue
function throttleWithRAF (fn) {
  let running = false;
  return function () {
    if (running) return;
    running = true;
    window.requestAnimationFrame(() => {
      fn.apply(this, arguments);
      running = false;
    });
  };
}

const App = CanComponent.extend("App", {
    tag: "can-app",
    view: CanStache(`
            <div class="App">
                <div class="App-header">
                    <img src="../src/logo.svg" class="App-logo" alt="logo" />
                    <h2>This is a dancing Pythagoras tree</h2>
                </div>
                <p class="App-intro">
                    <svg ($inserted)="registerMouseMove(%element)" width="{{svg.width}}" height="{{svg.height}}" ref="svg"
                         style="border: 1px solid lightgray">

                        <can-pythagoras w="{{baseW}}"
                                    h="{{baseW}}"
                                    height-factor="{{heightFactor}}"
                                    lean="{{lean}}"
                                    x="{{x}}"
                                    y="{{y}}"
                                    lvl="0"
                                    maxlvl="{{currentMax}}"/>
                    </svg>
                </p>
            </div>`),
    viewModel: function() {
        return new (CanSimpleMap.extend("AppVM", {
            x: function() {
                return this.get('svg').width / 2 - 40;
            },
            y: function() {
                return this.get('svg').height - this.get('baseW');
            },
            registerMouseMove(el) {
                this.set('$svgEl', el);
                d3select(el).on("mousemove", this.onMouseMove.bind(this));            
            },
            // Throttling approach borrowed from Vue fork
            // https://github.com/yyx990803/vue-fractal/blob/master/src/App.vue
            // rAF makes it slower than just throttling on React update
            onMouseMove(event) {
                if (this.get('running')) return;
                this.set('running', true);

                const [x, y] = d3mouse(this.get('$svgEl')),

                      scaleFactor = scaleLinear().domain([this.get('svg').height, 0])
                                                 .range([0, .8]),

                      scaleLean = scaleLinear().domain([0, this.get('svg').width/2, this.get('svg').width])
                                               .range([.5, 0, -.5]);

                this.set({
                    heightFactor: scaleFactor(y),
                    lean: scaleLean(x)
                });
                this.set('running', false);
            }
        }))({
            svg: {
                width: 1280,
                height: 600
            },
            currentMax: 0,
            baseW: 80,
            heightFactor: 0,
            lean: 0,
            running: false,
            realMax: 11
        });
    },

    init() {
        this.next();
    },

    next() {
        if (this.viewModel.get('currentMax') < this.viewModel.get('realMax')) {
            this.viewModel.set('currentMax', this.viewModel.get('currentMax')+1);
            setTimeout(this.next.bind(this), 500);
        }
    },
});

export default App;
