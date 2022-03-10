import * as Rx from "rxjs";

const range = (count: number) => [...Array(count).keys()];

export type TOptions = {
  /** How many items to emit on creation */
  initialCount: number;
};
type TPartialOptions = Partial<TOptions>;

export function from<T>(
  iterable: AsyncIterable<T> | Iterable<T>,
  { initialCount = 1 }: TPartialOptions = {}
): [obserable: Rx.Observable<T>, pull: () => void] {
  let actualPull = () => {};
  function pull() {
    actualPull();
  }

  const ob = new Rx.Observable<T>((s) => {
    let iterator: AsyncIterator<T> | Iterator<T>;

    if ((iterable as any)[Symbol.asyncIterator]) {
      iterator = (iterable as any)[Symbol.asyncIterator]();
    } else {
      iterator = (iterable as any)[Symbol.iterator]();
    }

    function handleResult(result: IteratorResult<T>) {
      if (complete) return;

      if (result.done) {
        complete = true;
        s.complete();
      } else {
        s.next(result.value);
      }
    }

    function handleError(err: any) {
      if (complete) return;

      complete = true;
      s.error(err);
    }

    let complete = false;
    actualPull = () => {
      if (complete) return;
      try {
        Promise.resolve(iterator.next()).then(handleResult).catch(handleError);
      } catch (err) {
        handleError(err);
      }
    };

    range(initialCount).forEach(actualPull);

    return () => {
      complete = true;
      actualPull = () => {};
      iterator.return?.();
    };
  });

  return [ob, pull];
}
