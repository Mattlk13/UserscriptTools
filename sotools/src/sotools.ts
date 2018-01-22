export function IsStackOverflow() {
    return !!window.location.href.match(/^https:\/\/stackoverflow.com/);
}

export function isNatoPage() {
    return !!window.location.href.match(/\/tools\/new-answers-old-questions/);
}
function parseNatoPage() {
    const nodes = $('.answer-hyperlink').parent().parent();
    const results = [];
    for (let i = 0; i < nodes.length; i++) {
        const node = $(nodes[i]);

        const postId = parseInt(node.find('.answer-hyperlink').attr('href').split('#')[1], 10);

        const answerTime = parseActionDate(node.find('.user-action-time'));
        const questionTime = parseActionDate(node.find('td .relativetime'));

        const authorReputation = parseReputation(node.find('.reputation-score'));
        const { authorName, authorId } = parseAuthorDetails(node.find('.user-details'));

        results.push({
            type: 'Answer' as 'Answer',
            element: node,
            page: 'NATO' as 'NATO',
            postId,
            answerTime,
            questionTime,
            authorReputation,
            authorName,
            authorId,
        });
    }
    return results;
}

export function isQuestionPage() {
    return !!window.location.href.match(/\/questions\/\d+.*/);
}
function parseQuestionPage() {
    const questionNode = $('.question');

    const postId = parseInt(questionNode.attr('data-questionid'), 10);

    function getPostDetails(node: JQuery) {
        const score = parseInt(node.find('.vote-count-post').text(), 10);

        const authorReputation = parseReputation(node.find('.post-signature .reputation-score').last());
        const { authorName, authorId } = parseAuthorDetails(node.find('.post-signature .user-details').last());

        const postTime = parseActionDate(node.find('.post-signature .relativetime').last());
        return { score, authorReputation, authorName, authorId, postTime };
    }
    let postDetails =  getPostDetails(questionNode);

    const results = [];
    const question = {
        type: 'Question' as 'Question',
        element: questionNode,
        page: 'Question' as 'Question',
        postId,
        postTime: postDetails.postTime,

        score: postDetails.score,

        authorReputation: postDetails.authorReputation,
        authorName: postDetails.authorName,
        authorId: postDetails.authorId
    };
    results.push(question);

    const answerNodes = $('.answer');
    for (let i = 0; i < answerNodes.length; i++) {
        const answerNode = $(answerNodes[i]);
        const answerId = parseInt(answerNode.attr('data-answerid'), 10);

        postDetails = getPostDetails(answerNode);

        results.push({
            type: 'Answer' as 'Answer',
            element: answerNode,
            page: 'Question' as 'Question',
            postId: answerId,
            question,

            postTime: postDetails.postTime,

            score: postDetails.score,

            authorReputation: postDetails.authorReputation,
            authorName: postDetails.authorName,
            authorId: postDetails.authorId
        });
    }
    return results;
}

export function isFlagsPage() {
    return !!window.location.href.match(/\/users\/flag-summary\//);
}
function parseFlagsPage() {
    const nodes = $('.flagged-post');
    const results = [];
    for (let i = 0; i < nodes.length; i++) {
        const node = $(nodes[i]);

        const type = node.find('.answer-hyperlink').length
            ? 'Answer'
            : 'Question';

        const postId =
            parseInt(
                type === 'Answer'
                    ? node.find('.answer-hyperlink').attr('href').split('#')[1]
                    : node.find('.question-hyperlink').attr('href').split('/')[2]
                , 10);
        const score = parseInt(node.find('.answer-votes').text(), 10);

        const { authorName, authorId } = parseAuthorDetails(node.find('.post-user-info'));
        const postTime = parseActionDate(node.find('.post-user-info .relativetime'));

        const handledTime = parseActionDate(node.find('.mod-flag .relativetime'));
        const fullHandledResult = node.find('.flag-outcome').text().trim().split(' - ');
        const handledResult = fullHandledResult[0].trim();
        const handledComment = fullHandledResult.slice(1).join(' - ').trim();

        results.push({
            type: type as 'Answer' | 'Question',
            element: node,
            page: 'Flags' as 'Flags',
            postId,
            score,
            postTime,
            handledTime,
            handledResult,
            handledComment,
            authorName,
            authorId
        });
    }
    return results;
}

function parseGenericPage() {
    const questionNodes = $('.question-hyperlink');
    const results = [];
    for (let i = 0; i < questionNodes.length; i++) {
        const questionNode = $(questionNodes[i]);
        let fragment = questionNode.attr('href').split('/')[2];
        if (fragment.indexOf('_') >= 0) {
            fragment = fragment.split('_')[1];
        }
        const postId = parseInt(fragment, 10);

        results.push({
            type: 'Question' as 'Question',
            element: questionNode,
            page: 'Unknown' as 'Unknown',
            postId
        });
    }
    const answerNodes = $('.answer-hyperlink');
    for (let i = 0; i < answerNodes.length; i++) {
        const answerNode = $(answerNodes[i]);
        let fragment = answerNode.attr('href').split('#')[1];
        if (fragment.indexOf('_') >= 0) {
            fragment = fragment.split('_')[1];
        }
        const postId = parseInt(fragment, 10);

        results.push({
            type: 'Answer' as 'Answer',
            element: answerNode,
            page: 'Unknown' as 'Unknown',
            postId
        });
    }
    return results;
}

export function parseQuestionsAndAnswers() {
    if (isNatoPage()) {
        // We explicitly type the page, as it allows the typescript compiler to
        // figure out the type of posts if a user checks if. For example:
        // const parsed = parseCurrentPage();
        // if (parsed.Page === 'Nato') {
        //     parsed.Posts is now properly typed as a nato post
        // }
        // If we don't do this, 'Page' is simply a string and doesn't give us any compiler hints
        return { Page: 'NATO' as 'NATO', Posts: parseNatoPage() };
    }
    if (isQuestionPage()) {
        return { Page: 'Question' as 'Question', Posts: parseQuestionPage() };
    }

    if (isFlagsPage()) {
        return { Page: 'Flags' as 'Flags', Posts: parseFlagsPage() };
    }

    return { Page: 'Unknown' as 'Unknown', Posts: parseGenericPage() };
}

function parseReputation(reputationDiv: JQuery) {
    let reputationText = reputationDiv.text();
    if (reputationText.indexOf('k') !== -1) {
        reputationText = reputationDiv.attr('title').substr('reputation score '.length);
    }
    reputationText = reputationText.replace(',', '');
    if (reputationText.trim() !== '') {
        return parseInt(reputationText, 10);
    }
    return undefined;
}
function parseAuthorDetails(authorDiv: JQuery) {
    const userLink = authorDiv.find('a');
    const authorName = userLink.text();
    const userLinkRef = userLink.attr('href');
    let authorId: number | undefined;
    // Users can be deleted, and thus have no link to their profile.
    if (userLinkRef) {
        authorId = parseInt(userLinkRef.split('/')[2], 10);
    }
    return { authorName, authorId };
}
function parseActionDate(actionDiv: JQuery) {
    if (!actionDiv.hasClass('relativetime')) {
        actionDiv = actionDiv.find('.relativetime');
    }
    const answerTime = new Date(actionDiv.attr('title'));
    return answerTime;
}
