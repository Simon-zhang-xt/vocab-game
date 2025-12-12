/**
 * Social Service
 * V3.5 Feature: Friend system, study groups, and leaderboards
 * Manages social interactions and collaborative learning
 */

import authService from './AuthService.js';

export default class SocialService {
    constructor() {
        this.currentUser = authService.getCurrentUser();
        this.friends = this.loadFriends();
        this.friendRequests = this.loadFriendRequests();
        this.studyGroups = this.loadStudyGroups();
        this.leaderboardData = this.loadLeaderboardData();
    }

    /**
     * Friend Management
     */

    /**
     * Send friend request
     */
    async sendFriendRequest(userId) {
        if (!this.currentUser) {
            throw new Error('Must be logged in to send friend requests');
        }

        // Check if already friends
        if (this.isFriend(userId)) {
            throw new Error('Already friends with this user');
        }

        // Check if request already exists
        if (this.hasPendingRequest(userId)) {
            throw new Error('Friend request already sent');
        }

        const request = {
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            from: this.currentUser.id,
            to: userId,
            status: 'pending',
            createdAt: Date.now()
        };

        this.friendRequests.push(request);
        this.saveFriendRequests();

        return request;
    }

    /**
     * Accept friend request
     */
    async acceptFriendRequest(requestId) {
        const request = this.friendRequests.find(r => r.id === requestId);

        if (!request) {
            throw new Error('Friend request not found');
        }

        if (request.to !== this.currentUser.id) {
            throw new Error('Cannot accept this request');
        }

        // Add friendship
        const friendship = {
            id: `friend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user1: request.from,
            user2: request.to,
            createdAt: Date.now()
        };

        this.friends.push(friendship);
        this.saveFriends();

        // Remove request
        this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
        this.saveFriendRequests();

        return friendship;
    }

    /**
     * Reject friend request
     */
    async rejectFriendRequest(requestId) {
        this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
        this.saveFriendRequests();
    }

    /**
     * Remove friend
     */
    async removeFriend(userId) {
        this.friends = this.friends.filter(f =>
            !(f.user1 === userId || f.user2 === userId)
        );
        this.saveFriends();
    }

    /**
     * Get user's friends list
     */
    getFriends() {
        if (!this.currentUser) return [];

        return this.friends
            .filter(f => f.user1 === this.currentUser.id || f.user2 === this.currentUser.id)
            .map(f => {
                const friendId = f.user1 === this.currentUser.id ? f.user2 : f.user1;
                const friendData = this.getUserData(friendId);

                return {
                    ...f,
                    friendId,
                    friendData
                };
            });
    }

    /**
     * Get pending friend requests
     */
    getPendingRequests() {
        if (!this.currentUser) return [];

        return this.friendRequests
            .filter(r => r.to === this.currentUser.id && r.status === 'pending')
            .map(r => ({
                ...r,
                fromUser: this.getUserData(r.from)
            }));
    }

    /**
     * Get sent friend requests
     */
    getSentRequests() {
        if (!this.currentUser) return [];

        return this.friendRequests
            .filter(r => r.from === this.currentUser.id && r.status === 'pending')
            .map(r => ({
                ...r,
                toUser: this.getUserData(r.to)
            }));
    }

    /**
     * Check if user is a friend
     */
    isFriend(userId) {
        if (!this.currentUser) return false;

        return this.friends.some(f =>
            (f.user1 === this.currentUser.id && f.user2 === userId) ||
            (f.user2 === this.currentUser.id && f.user1 === userId)
        );
    }

    /**
     * Check if pending request exists
     */
    hasPendingRequest(userId) {
        if (!this.currentUser) return false;

        return this.friendRequests.some(r =>
            r.from === this.currentUser.id &&
            r.to === userId &&
            r.status === 'pending'
        );
    }

    /**
     * Study Group Management
     */

    /**
     * Create study group
     */
    async createStudyGroup(groupData) {
        if (!this.currentUser) {
            throw new Error('Must be logged in to create study groups');
        }

        const group = {
            id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: groupData.name,
            description: groupData.description || '',
            creator: this.currentUser.id,
            members: [this.currentUser.id],
            memberRoles: {
                [this.currentUser.id]: 'owner'
            },
            settings: {
                isPublic: groupData.isPublic !== false,
                maxMembers: groupData.maxMembers || 50,
                allowInvites: groupData.allowInvites !== false
            },
            stats: {
                totalWords: 0,
                totalSessions: 0,
                avgScore: 0
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.studyGroups.push(group);
        this.saveStudyGroups();

        return group;
    }

    /**
     * Join study group
     */
    async joinStudyGroup(groupId) {
        if (!this.currentUser) {
            throw new Error('Must be logged in to join study groups');
        }

        const group = this.studyGroups.find(g => g.id === groupId);

        if (!group) {
            throw new Error('Study group not found');
        }

        if (group.members.includes(this.currentUser.id)) {
            throw new Error('Already a member of this group');
        }

        if (group.members.length >= group.settings.maxMembers) {
            throw new Error('Group is full');
        }

        group.members.push(this.currentUser.id);
        group.memberRoles[this.currentUser.id] = 'member';
        group.updatedAt = Date.now();

        this.saveStudyGroups();

        return group;
    }

    /**
     * Leave study group
     */
    async leaveStudyGroup(groupId) {
        const group = this.studyGroups.find(g => g.id === groupId);

        if (!group) {
            throw new Error('Study group not found');
        }

        group.members = group.members.filter(m => m !== this.currentUser.id);
        delete group.memberRoles[this.currentUser.id];
        group.updatedAt = Date.now();

        // If owner leaves, transfer ownership or delete group
        if (group.creator === this.currentUser.id) {
            if (group.members.length > 0) {
                group.creator = group.members[0];
                group.memberRoles[group.members[0]] = 'owner';
            } else {
                // Delete empty group
                this.studyGroups = this.studyGroups.filter(g => g.id !== groupId);
            }
        }

        this.saveStudyGroups();
    }

    /**
     * Get user's study groups
     */
    getUserStudyGroups() {
        if (!this.currentUser) return [];

        return this.studyGroups
            .filter(g => g.members.includes(this.currentUser.id))
            .map(g => ({
                ...g,
                role: g.memberRoles[this.currentUser.id],
                isOwner: g.creator === this.currentUser.id
            }));
    }

    /**
     * Get public study groups
     */
    getPublicStudyGroups() {
        return this.studyGroups
            .filter(g => g.settings.isPublic)
            .map(g => ({
                ...g,
                isMember: g.members.includes(this.currentUser?.id)
            }));
    }

    /**
     * Get study group details
     */
    getStudyGroup(groupId) {
        const group = this.studyGroups.find(g => g.id === groupId);

        if (!group) return null;

        return {
            ...group,
            membersData: group.members.map(memberId => this.getUserData(memberId))
        };
    }

    /**
     * Update group stats
     */
    updateGroupStats(groupId, stats) {
        const group = this.studyGroups.find(g => g.id === groupId);

        if (group && group.members.includes(this.currentUser?.id)) {
            group.stats = {
                ...group.stats,
                ...stats
            };
            group.updatedAt = Date.now();
            this.saveStudyGroups();
        }
    }

    /**
     * Leaderboard Management
     */

    /**
     * Update user leaderboard data
     */
    updateLeaderboardData(userData) {
        if (!this.currentUser) return;

        const existingIndex = this.leaderboardData.findIndex(
            u => u.userId === this.currentUser.id
        );

        const newData = {
            userId: this.currentUser.id,
            username: this.currentUser.email.split('@')[0],
            avatar: this.currentUser.avatar || '👤',
            stats: {
                totalWords: userData.totalWords || 0,
                totalScore: userData.totalScore || 0,
                avgAccuracy: userData.avgAccuracy || 0,
                studyDays: userData.studyDays || 0,
                achievements: userData.achievements || []
            },
            updatedAt: Date.now()
        };

        if (existingIndex >= 0) {
            this.leaderboardData[existingIndex] = newData;
        } else {
            this.leaderboardData.push(newData);
        }

        this.saveLeaderboardData();
    }

    /**
     * Get global leaderboard
     */
    getGlobalLeaderboard(metric = 'totalScore', limit = 100) {
        return [...this.leaderboardData]
            .sort((a, b) => b.stats[metric] - a.stats[metric])
            .slice(0, limit)
            .map((user, index) => ({
                ...user,
                rank: index + 1,
                isCurrentUser: user.userId === this.currentUser?.id
            }));
    }

    /**
     * Get friends leaderboard
     */
    getFriendsLeaderboard(metric = 'totalScore') {
        const friends = this.getFriends();
        const friendIds = friends.map(f => f.friendId);

        // Include current user
        if (this.currentUser) {
            friendIds.push(this.currentUser.id);
        }

        return this.leaderboardData
            .filter(u => friendIds.includes(u.userId))
            .sort((a, b) => b.stats[metric] - a.stats[metric])
            .map((user, index) => ({
                ...user,
                rank: index + 1,
                isCurrentUser: user.userId === this.currentUser?.id
            }));
    }

    /**
     * Get group leaderboard
     */
    getGroupLeaderboard(groupId, metric = 'totalScore') {
        const group = this.studyGroups.find(g => g.id === groupId);

        if (!group) return [];

        return this.leaderboardData
            .filter(u => group.members.includes(u.userId))
            .sort((a, b) => b.stats[metric] - a.stats[metric])
            .map((user, index) => ({
                ...user,
                rank: index + 1,
                isCurrentUser: user.userId === this.currentUser?.id
            }));
    }

    /**
     * Get user rank
     */
    getUserRank(metric = 'totalScore') {
        if (!this.currentUser) return null;

        const leaderboard = this.getGlobalLeaderboard(metric, 10000);
        const userEntry = leaderboard.find(u => u.userId === this.currentUser.id);

        return userEntry ? userEntry.rank : null;
    }

    /**
     * Helper Methods
     */

    /**
     * Get user data (mock implementation)
     * In production, this would fetch from backend
     */
    getUserData(userId) {
        // Check leaderboard data first
        const leaderboardEntry = this.leaderboardData.find(u => u.userId === userId);

        if (leaderboardEntry) {
            return {
                id: userId,
                username: leaderboardEntry.username,
                avatar: leaderboardEntry.avatar,
                stats: leaderboardEntry.stats
            };
        }

        // Mock data if not found
        return {
            id: userId,
            username: `User${userId.substr(0, 6)}`,
            avatar: '👤',
            stats: {
                totalWords: 0,
                totalScore: 0,
                avgAccuracy: 0,
                studyDays: 0
            }
        };
    }

    /**
     * Search users by username
     */
    searchUsers(query) {
        if (!query || query.length < 2) return [];

        const lowerQuery = query.toLowerCase();

        return this.leaderboardData
            .filter(u =>
                u.username.toLowerCase().includes(lowerQuery) &&
                u.userId !== this.currentUser?.id
            )
            .slice(0, 20);
    }

    /**
     * Get social statistics
     */
    getSocialStats() {
        if (!this.currentUser) {
            return {
                friends: 0,
                groups: 0,
                globalRank: null,
                friendsRank: null
            };
        }

        return {
            friends: this.getFriends().length,
            groups: this.getUserStudyGroups().length,
            globalRank: this.getUserRank('totalScore'),
            friendsRank: this.getFriendsLeaderboard('totalScore').findIndex(
                u => u.userId === this.currentUser.id
            ) + 1
        };
    }

    /**
     * Storage Methods
     */

    loadFriends() {
        try {
            const data = localStorage.getItem('socialFriends');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load friends:', error);
            return [];
        }
    }

    saveFriends() {
        try {
            localStorage.setItem('socialFriends', JSON.stringify(this.friends));
        } catch (error) {
            console.error('Failed to save friends:', error);
        }
    }

    loadFriendRequests() {
        try {
            const data = localStorage.getItem('socialFriendRequests');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load friend requests:', error);
            return [];
        }
    }

    saveFriendRequests() {
        try {
            localStorage.setItem('socialFriendRequests', JSON.stringify(this.friendRequests));
        } catch (error) {
            console.error('Failed to save friend requests:', error);
        }
    }

    loadStudyGroups() {
        try {
            const data = localStorage.getItem('socialStudyGroups');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load study groups:', error);
            return [];
        }
    }

    saveStudyGroups() {
        try {
            localStorage.setItem('socialStudyGroups', JSON.stringify(this.studyGroups));
        } catch (error) {
            console.error('Failed to save study groups:', error);
        }
    }

    loadLeaderboardData() {
        try {
            const data = localStorage.getItem('socialLeaderboard');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            return [];
        }
    }

    saveLeaderboardData() {
        try {
            localStorage.setItem('socialLeaderboard', JSON.stringify(this.leaderboardData));
        } catch (error) {
            console.error('Failed to save leaderboard:', error);
        }
    }

    /**
     * Clear all social data
     */
    clearAllData() {
        this.friends = [];
        this.friendRequests = [];
        this.studyGroups = [];
        this.leaderboardData = [];

        this.saveFriends();
        this.saveFriendRequests();
        this.saveStudyGroups();
        this.saveLeaderboardData();
    }
}
