import { DiscussionType } from '@putongoj/shared'

const discussionSeeds = [
  {
    // Will be discussion #1 - Open Discussion
    type: DiscussionType.OpenDiscussion,
    title: 'Welcome to the OJ Discussion Board',
    authorUid: 'admin',
    content: 'This is an open discussion for everyone to participate.',
  },
  {
    // Will be discussion #2 - Public Announcement
    type: DiscussionType.PublicAnnouncement,
    title: 'Important System Update',
    authorUid: 'admin',
    content: 'The system will be updated this weekend.',
  },
  {
    // Will be discussion #3 - Private Clarification
    type: DiscussionType.PrivateClarification,
    title: 'Private Question',
    authorUid: 'primaryuser',
    content: 'This is a private question.',
  },
  {
    // Will be discussion #4 - Open Discussion with problem
    type: DiscussionType.OpenDiscussion,
    title: 'Help with A + B Problem',
    authorUid: 'ugordon',
    problemPid: 1000,
    content: 'Can someone help me understand this problem?',
  },
]

export { discussionSeeds }
