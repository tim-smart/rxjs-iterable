# rxjs-iterable

Create observables from iterables with backpressure support.

## Usage

```typescript
import * as Fs from "fs";
import * as RxOp from "rxjs/operators";
import * as RxI from "rxjs-iterable";

const CONCURRENCY = 2;

const [file$, push] = RxI.from<Buffer>(Fs.createReadStream(process.argv[2]), {
  // How many chunks of data do we want to initially consume?
  initialCount: CONCURRENCY,
});

file$
  .pipe(
    RxOp.map((b) => b.toString()),

    // Call push to indicate we are ready to consume more data
    RxOp.tap(push),
  )
  .subscribe(console.log);
```
