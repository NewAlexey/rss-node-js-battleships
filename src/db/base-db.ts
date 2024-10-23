export class BaseDataBase<D extends { id: number }> {
    private readonly db: Map<number | string, D> = new Map();

    public get(id: string | number): D | undefined {
        return this.db.get(id);
    }

    public getAll(): D[] {
        return [...this.db.values()];
    }

    public add(dto: Omit<D, "id">, id?: string | number): D {
        const entity = { ...dto, id: id || new Date().getTime() } as D;

        this.save(entity);

        return entity;
    }

    private save(entity: D): void {
        this.db.set(entity.id, entity);
    }
}
