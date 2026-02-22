
declare const Sk: any;

export const runSkulpt = (code: string, telloController: any, onLog?: (msg: string) => void) => {
  return new Promise((resolve, reject) => {
    // Define internal bridge functions in Sk.builtins
    // These will be called by the Python wrapper
    
    const wrapAsync = (fn: () => Promise<any>) => {
        return new Sk.builtin.func(function() {
            return new Sk.misceval.promiseToSuspension(new Promise((resolve, reject) => {
                fn().then(() => resolve(Sk.builtin.none.none$))
                    .catch((e: any) => reject(e || new Error('Unknown error')));
            }));
        });
    };

    const wrapAsync1 = (fn: (arg1: any) => Promise<any>) => {
        return new Sk.builtin.func(function(arg1: any) {
            const jsArg1 = Sk.ffi.remapToJs(arg1);
            return new Sk.misceval.promiseToSuspension(new Promise((resolve, reject) => {
                fn(jsArg1).then(() => resolve(Sk.builtin.none.none$))
                    .catch((e: any) => reject(e || new Error('Unknown error')));
            }));
        });
    };

    const wrapAsync4 = (fn: (a: any, b: any, c: any, d: any) => Promise<any>) => {
        return new Sk.builtin.func(function(a: any, b: any, c: any, d: any) {
            const jsA = Sk.ffi.remapToJs(a);
            const jsB = Sk.ffi.remapToJs(b);
            const jsC = Sk.ffi.remapToJs(c);
            const jsD = Sk.ffi.remapToJs(d);
            return new Sk.misceval.promiseToSuspension(new Promise((resolve, reject) => {
                fn(jsA, jsB, jsC, jsD).then(() => resolve(Sk.builtin.none.none$))
                    .catch((e: any) => reject(e || new Error('Unknown error')));
            }));
        });
    };

    Sk.builtins['_tello_takeoff'] = wrapAsync(() => telloController.takeoff());
    Sk.builtins['_tello_land'] = wrapAsync(() => telloController.land());
    Sk.builtins['_tello_forward'] = wrapAsync1((d) => telloController.forward(d));
    Sk.builtins['_tello_back'] = wrapAsync1((d) => telloController.back(d));
    Sk.builtins['_tello_left'] = wrapAsync1((d) => telloController.left(d));
    Sk.builtins['_tello_right'] = wrapAsync1((d) => telloController.right(d));
    Sk.builtins['_tello_up'] = wrapAsync1((d) => telloController.up(d));
    Sk.builtins['_tello_down'] = wrapAsync1((d) => telloController.down(d));
    
    Sk.builtins['_tello_rotate_cw'] = wrapAsync1((d) => telloController.rotate('cw', d));
    Sk.builtins['_tello_rotate_ccw'] = wrapAsync1((d) => telloController.rotate('ccw', d));
    Sk.builtins['_tello_flip'] = wrapAsync1((d) => telloController.flip(d));
    Sk.builtins['_tello_set_speed'] = wrapAsync1((s) => telloController.set_speed(s));
    
    Sk.builtins['_tello_go_xyz_speed'] = wrapAsync4((x, y, z, s) => telloController.go_xyz_speed(x, y, z, s));

    Sk.builtins['_tello_get_battery'] = new Sk.builtin.func(function() {
        try {
            const battery = telloController.get_battery();
            console.log('get_battery called, result:', battery);
            return Sk.ffi.remapToPy(battery !== undefined ? battery : 0);
        } catch (e) {
            console.error('Error in _tello_get_battery:', e);
            throw e;
        }
    });

    Sk.builtins['_tello_get_height'] = new Sk.builtin.func(function() {
        try {
            const height = telloController.get_height();
            return Sk.ffi.remapToPy(height !== undefined ? height : 0);
        } catch (e) {
            console.error('Error in _tello_get_height:', e);
            throw e;
        }
    });

    Sk.builtins['_tello_emergency'] = wrapAsync(() => telloController.emergency());

    // Inject djitellopy module directly into builtinFiles
    if (Sk.builtinFiles === undefined) {
        Sk.builtinFiles = { files: {} };
    }

    // Source for the mock djitellopy module
    const djitellopySource = `
class Tello:
    def __init__(self):
        pass
    def connect(self, **kwargs):
        pass
    def takeoff(self):
        return _tello_takeoff()
    def land(self):
        return _tello_land()
    def move_forward(self, dist):
        return _tello_forward(dist)
    def move_back(self, dist):
        return _tello_back(dist)
    def move_left(self, dist):
        return _tello_left(dist)
    def move_right(self, dist):
        return _tello_right(dist)
    def move_up(self, dist):
        return _tello_up(dist)
    def move_down(self, dist):
        return _tello_down(dist)
    def rotate_clockwise(self, deg):
        return _tello_rotate_cw(deg)
    def rotate_counter_clockwise(self, deg):
        return _tello_rotate_ccw(deg)
    def rotate_cw(self, deg):
        return _tello_rotate_cw(deg)
    def rotate_ccw(self, deg):
        return _tello_rotate_ccw(deg)
    def flip(self, dir):
        return _tello_flip(dir)
    def set_speed(self, speed):
        return _tello_set_speed(speed)
    def go_xyz_speed(self, x, y, z, speed):
        return _tello_go_xyz_speed(x, y, z, speed)
    def get_battery(self):
        return _tello_get_battery()
    def get_height(self):
        return _tello_get_height()
    def emergency(self):
        return _tello_emergency()
    def end(self):
        pass
`;

    // Configure Skulpt
    Sk.configure({
      output: (text: string) => {
        console.log('Python Output:', text);
        if (onLog) onLog(text);
      },
      read: (x: string) => {
        // Explicitly handle djitellopy import
        if (x === 'djitellopy.py' || x === 'djitellopy/__init__.py' || 
            x === './djitellopy.py' || x === './djitellopy/__init__.py') {
            return djitellopySource;
        }

        if (Sk.builtinFiles === undefined || 
            Sk.builtinFiles["files"] === undefined || 
            Sk.builtinFiles["files"][x] === undefined) {
          throw "File not found: '" + x + "'";
        }
        
        return Sk.builtinFiles["files"][x];
      },
      __future__: Sk.python3
    });

    // Run the code
    const promise = Sk.misceval.asyncToPromise(() => {
        return Sk.importMainWithBody("<stdin>", false, code, true);
    });

    promise.then(
        (mod: any) => {
            console.log('Python execution complete');
            resolve(mod);
        },
        (err: any) => {
            const msg = err ? err.toString() : 'Unknown Error';
            console.error('Python execution error:', msg);
            reject(err || new Error(msg));
        }
    );
  });
};
