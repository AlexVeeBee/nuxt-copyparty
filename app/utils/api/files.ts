import ApiBase from "./base"

export interface ITree {
    [key: string]: {
        [key: string]: ITree | string[] | undefined;
        a: string[];
    };
}

export interface IDirectoryEntry {
    lead: string;
    href: string;
    sz: number;
    ext: string;
    ts: number;
    tags: Object;
}

export interface IFileEntry {
    lead: string;
    href: string;
    sz: number;
    ext: string;
    ts: number;
    tags: {
        fmt: string;
        vc: string;
        ".fps": number;
        res: string;
    };
}

export default class FilesAPI extends ApiBase {
    constructor(url?: string) {
        super(url);
    }

    async getFiles(path: string): Promise<{
        files: IFileEntry[];
        dirs: IDirectoryEntry[];
    }> {
        const res = await this.$fetch<{
            files: IFileEntry[];
            dirs: IDirectoryEntry[];
        }>(`${path.startsWith('/') ? '' : '/'}${path}?ls`);
        return res;
    }

    async listTree(path: string): Promise<ITree> {
        const res = await this.$fetch<ITree>(`${path.startsWith('/') ? '' : '/'}${path}?tree`);
        return res;
    }
}