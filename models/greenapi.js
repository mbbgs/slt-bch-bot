import whatsAppClient from '@green-api/whatsapp-api-client';

export default class GreenAPIClient {
    
    /**
     * Creates a new Green-API client instance
     * @param {string} idInstance       - Green-API instance ID
     * @param {string} apiTokenInstance - API authentication token
     * @constructor
     */
    constructor(idInstance, apiTokenInstance) {
        if (!idInstance || !apiTokenInstance) {
            throw new Error('idInstance and apiTokenInstance are required');
        }
        this.restAPI = whatsAppClient.restAPI({
            idInstance,
            apiTokenInstance,
        });
    }
    
    getInstance() {
        return this.restAPI ? this.restAPI !== null : this.restAPI
    }
    /**
     * Send a plain text message to a chat or group
     * @function sendMessage
     * @param {string} chatId - Format: "234xxxxxxxxxx@c.us" or "120363xxxx@g.us"
     * @param {string} text   - Message content
     * @returns {Promise<{idMessage: string}>}
     */
    async sendMessage(chatId, text) {
        if (!chatId || !text) throw new Error('chatId and text required');
        return this.restAPI.message.sendMessage(chatId, null, text);
    }
    
    /**
     * Send a reply quoting an existing message
     * @function replyMessage
     * @param {string} chatId
     * @param {string} quotedMessageId - The idMessage to quote/reply to
     * @param {string} text
     * @returns {Promise<{idMessage: string}>}
     */
    async replyMessage(chatId, quotedMessageId, text) {
        if (!chatId || !quotedMessageId || !text) {
            throw new Error('chatId, quotedMessageId and text required');
        }
        return this.restAPI.message.sendMessage(chatId, quotedMessageId, text);
    }
    
    
    /**
     * Tag ALL members in the group with an optional message
     * (You must be admin or have permission to @everyone-like mention)
     * @function tagAllMembers
     * @param {string} groupId - Group chat ID ("120363xxxxxxxx@g.us")
     * @param {string} [customText=""] - Optional text to send along with the tags
     * @param {number} [chunkSize=80] - Max mentions per message (WhatsApp limit ~100–200)
     * @returns {Promise<Array<{idMessage: string}>>} Array of sent message IDs (one or more if chunked)
     */
    async tagAllMembers(groupId, customText = '', chunkSize = 80) {
        if (!groupId.endsWith('@g.us')) {
            throw new Error('groupId must end with @g.us');
        }
        
        // Get current participants
        const groupData = await this.restAPI.group.getGroupData(groupId);
        const participants = groupData.participants || [];
        
        if (participants.length === 0) {
            throw new Error('No participants found in group');
        }
        
        // Build list of mentionable chatIds
        const mentions = participants.map(p => p.id).filter(id => id.endsWith('@c.us'));
        
        // Split into chunks to avoid WhatsApp message limit
        const chunks = [];
        for (let i = 0; i < mentions.length; i += chunkSize) {
            chunks.push(mentions.slice(i, i + chunkSize));
        }
        
        const sentMessages = [];
        
        for (const chunk of chunks) {
            // Format mentions like @234xxxxxxxxxx (Green-API accepts phone numbers without @c.us in mentions)
            const mentionText = chunk
                .map(phone => `@${phone.replace('@c.us', '')}`)
                .join(' ');
            
            const fullText = customText ?
                `\( {customText}\n\n \){mentionText}` :
                mentionText;
            
            const res = await this.restAPI.message.sendMessage(groupId, null, fullText, {
                // Tell Green-API these are mentions
                mentions: chunk,
            });
            
            sentMessages.push(res);
        }
        
        return sentMessages;
    }
    
    /**
     * Vet / lookup basic user info (name, avatar, existence) – used like !vet "234xxxxxxxxxx"
     * @function vetUser
     * @param {string} phoneOrChatId - Phone number or full chatId
     * @returns {Promise<{
     *   chatId: string,
     *   exists: boolean,
     *   name: string|null,
     *   desc: string|null,
     *   avatar: string|null
     * }>}
     */
    async vetUser(phoneOrChatId) {
        let chatId = phoneOrChatId;
        if (!chatId.endsWith('@c.us')) {
            chatId = chatId.replace(/[^0-9]/g, '') + '@c.us';
        }
        
        try {
            const info = await this.restAPI.contact.getContactInfo(chatId);
            
            let avatar = null;
            try {
                const avatarData = await this.restAPI.contact.getAvatar(chatId);
                avatar = avatarData?.urlAvatar || null;
            } catch {
                // avatar fetch failed or doesn't exist
            }
            
            return {
                chatId,
                exists: !!info?.existsWhatsapp,
                name: info?.name || info?.shortName || null,
                desc: info?.description || null,
                avatar,
            };
        } catch (err) {
            return {
                chatId,
                exists: false,
                name: null,
                desc: null,
                avatar: null,
            };
        }
        
    }
    async removeUser(groupId, participant) {
        if (!groupId.endsWith('@g.us') || !participant.endsWith('@c.us')) {
            throw new Error('Invalid groupId or participant format');
        }
        return this.restAPI.group.removeGroupParticipant(groupId, participant);
    }
}