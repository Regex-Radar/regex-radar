export interface IDisposable {
    dispose(): void | Promise<void>;
}

export abstract class Disposable implements IDisposable {
    protected disposables: IDisposable[] = [];

    dispose(): void {
        // TODO: handle async + errors
        this.disposables.forEach((disposable) => {
            try {
                Promise.resolve(disposable.dispose()).catch(this.onError);
            } catch (error) {
                this.onError(error);
            }
        });
    }

    protected onError(error: unknown) {
        try {
            console.error(`error occured while disposing: ${error}`, error);
        } catch (_) {}
    }
}
