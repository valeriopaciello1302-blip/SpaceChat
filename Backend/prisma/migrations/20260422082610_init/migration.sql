/*
  Warnings:

  - You are about to drop the column `receiverId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `_ConversationToMessage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `conversationId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_receiverId_fkey`;

-- DropForeignKey
ALTER TABLE `_ConversationToMessage` DROP FOREIGN KEY `_ConversationToMessage_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ConversationToMessage` DROP FOREIGN KEY `_ConversationToMessage_B_fkey`;

-- DropIndex
DROP INDEX `Message_receiverId_fkey` ON `Message`;

-- AlterTable
ALTER TABLE `Message` DROP COLUMN `receiverId`,
    ADD COLUMN `conversationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `stato` ENUM('ONLINE', 'AWAY', 'OFFLINE') NOT NULL DEFAULT 'OFFLINE',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- DropTable
DROP TABLE `_ConversationToMessage`;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
