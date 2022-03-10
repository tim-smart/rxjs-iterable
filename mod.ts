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
): [Rx.Observable<T>, () => void] {
  let push = () => {};

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
    push = () => {
      if (complete) return;
      try {
        Promise.resolve(iterator.next()).then(handleResult).catch(handleError);
      } catch (err) {
        handleError(err);
      }
    };

    range(initialCount).forEach(push);

    return () => {
      complete = true;
      iterator.return?.();
    };
  });

  return [ob, push];
}
