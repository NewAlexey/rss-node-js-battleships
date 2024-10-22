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

    // public remove(id: number): number {
    //     this.db.delete(id);
    //
    //     return id;
    // }

    // public add(dto: Omit<D, "id">): D {
    //     const entity = { ...dto, id: new Date().getTime() } as D;
    //
    //     this.save(entity);
    //
    //     return entity;
    // }
    //
    // public update(entity: D): D {
    //     const existUser: D | undefined = this.get(entity.id);
    //
    //     if (!existUser) {
    //         throw new Error("Entity not found.");
    //     }
    //
    //     this.save(entity);
    //
    //     return entity;
    // }
}
