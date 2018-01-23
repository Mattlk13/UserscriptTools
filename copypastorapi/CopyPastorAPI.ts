declare const GM_xmlhttpRequest: any;

import { Observable } from 'rxjs/Observable';
import { SimpleCache } from '../caching/SimpleCache';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';
import { ChatApi } from '@userscriptTools/chatapi/ChatApi';

const copyPastorServer = 'http://copypastor.sobotics.org';

const soboticsRoomId = 111347;

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

    constructor(private answerId: number, private key: string) {
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
        return this.SendFeedback('tp');
    }

    public async ReportFalsePositive() {
        return this.SendFeedback('fp');
    }

    private async SendFeedback(type: 'tp' | 'fp') {
        const username = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
        const chatApi = new ChatApi();
        const chatId = await chatApi.GetChatUserId(soboticsRoomId);
        const results = await this.Promise();

        const payloads = results.map(result => {
            const postId = result.post_id;
            const payload = {
                post_id: postId,
                feedback_type: type,
                username,
                link: `https://chat.stackoverflow.com/users/${chatId}`,
                key: this.key,
            };
            return payload;
        });

        const promises = payloads.map(payload => {
            return new Promise<boolean>((resolve, reject) => {
                $.ajax({
                    type: 'POST',
                    url: `${copyPastorServer}/feedback/create`,
                    data: payload
                }).done(() => resolve(true))
                    .fail(() => reject());
            });
        });
        const allResults = await Promise.all(promises);
        if (allResults.length <= 0) {
            return false;
        }
        for (let i = 0; i < allResults.length; i++) {
            if (!allResults[i]) {
                return false;
            }
        }
        return true;
    }
}
