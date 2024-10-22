export class BaseDataBase<D extends { name: string; id: number }> {
    private readonly db: Map<string, D> = new Map();

    public get(name: string): D | undefined {
        return this.db.get(name);
    }

    public getAll(): D[] {
        return [...this.db.values()];
    }

    public add(dto: Omit<D, "id">): D {
        const entity = { ...dto, id: new Date().getTime() } as D;

        this.save(entity);

        return entity;
    }

    private save(entity: D): void {
        this.db.set(entity.name, entity);
    }
}
