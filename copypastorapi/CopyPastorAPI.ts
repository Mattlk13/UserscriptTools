declare const GM_xmlhttpRequest: any;

import { Observable } from 'rxjs/Observable';
import { SimpleCache } from '../caching/SimpleCache';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';

const copyPastorServer = 'http://copypastor.sobotics.org';

export interface CopyPastorFindTargetResponseItem {
    post_id: string;
    target_url: string;
}

export type CopyPastorFindTargetResponse = {
    status: 'success';
    posts: CopyPastorFindTargetResponseItem[];
} | {
        status: 'failure';
        message: string;
    };

export class CopyPastorAPI {
    private subject: Subject<CopyPastorFindTargetResponseItem[]>;
    private replaySubject: ReplaySubject<CopyPastorFindTargetResponseItem[]>;

    constructor(private answerId: number) {
    }

    public Watch(): Observable<CopyPastorFindTargetResponseItem[]> {
        this.subject = new Subject<CopyPastorFindTargetResponseItem[]>();
        this.replaySubject = new ReplaySubject<CopyPastorFindTargetResponseItem[]>(1);
        this.subject.subscribe(this.replaySubject);

        SimpleCache.GetAndCache(`CopyPastor.FindTarget.${this.answerId}`, () => new Promise<CopyPastorFindTargetResponseItem[]>((resolve, reject) => {
            const url = `${copyPastorServer}/posts/findTarget?url=//${window.location.hostname}/a/${this.answerId}`;
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload: (response: any) => {
                    const responseObject = JSON.parse(response.responseText) as CopyPastorFindTargetResponse;
                    if (responseObject.status === 'success') {
                        resolve(responseObject.posts);
                    } else {
                        reject(responseObject.message);
                    }
                },
                onerror: (response: any) => {
                    reject(response);
                },
            });
        }))
            .then(r => this.subject.next(r))
            .catch(err => this.subject.error(err));

        return this.subject;
    }

    public Promise(): Promise<CopyPastorFindTargetResponseItem[]> {
        return this.replaySubject.take(1).toPromise();
    }

    public async ReportTruePositive() {
        return Promise.resolve(false);
    }

    public async ReportFalsePositive() {
        return Promise.resolve(false);
    }
}
