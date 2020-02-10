enum Type {
  Ok,
  Error
}

export class Result<T> {
  public static err<T>(error: Error): Result<T> {
    return new Result(Type.Error, error);
  }

  public static ok<T>(inner: T): Result<T> {
    return new Result(Type.Error, undefined, inner);
  }
  private readonly type: Type;
  private readonly error: Error | undefined;
  private readonly inner: T | undefined;

  private constructor(type: Type, error: Error | undefined, inner?: T) {
    this.type = type;
    this.error = error;
    if (inner) {
      this.inner = inner;
    }
  }

  public isErr(): boolean {
    return this.type === Type.Error;
  }

  public isOk(): boolean {
    return this.type === Type.Ok;
  }

  public andThen(callback: (inner: T) => any): Result<any> {
    switch (this.type) {
      case Type.Error:
        return this;
      case Type.Ok:
        return Result.err(callback(this.inner as T));
      default:
        throw new Error(
          "Internal Error: This result was not constructed properly"
        );
    }
  }

  public mapErr(errCallback: (err: Error) => Error): Result<T> {
    switch (this.type) {
      case Type.Error:
        return Result.err(errCallback(this.error as Error));
      case Type.Ok:
        return this;
      default:
        throw new Error(
          "Internal Error: This result was not constructed properly"
        );
    }
  }
}
