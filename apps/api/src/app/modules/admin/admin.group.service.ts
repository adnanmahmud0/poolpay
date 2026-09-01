import mongoose from "mongoose";
import { Group } from "../group/group.model";
import { GroupMember } from "../groupMember/groupMember.model";
import { GroupServices } from "../group/group.service";
import { Notification, NotificationType } from "../notification/notification.model";
import { GroupStatus } from "../group/group.interface";
import { MemberStatus } from "../groupMember/groupMember.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { logActivity } from "../../utils/activityLogger";
import { emitRealTimeNotification, enqueuePushNotification } from "../../utils/notification.utils";

const getAllGroups = async (query: Record<string, unknown>) => {
  const groupQuery = new QueryBuilder(
    Group.find({ isDeleted: { $ne: true } }).populate("createdBy", "firstName lastName email"),
    query as Record<string, string>
  )
    .search(["name"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = await groupQuery.build().lean();
  const meta = await groupQuery.getMeta();

  const [activeGroups, upcomingGroups, uniqueMembers, totalGroups] = await Promise.all([
    Group.countDocuments({ status: GroupStatus.ACTIVE, isDeleted: { $ne: true } }),
    Group.countDocuments({ status: GroupStatus.UPCOMING, isDeleted: { $ne: true } }),
    GroupMember.distinct("userId", { status: MemberStatus.ACTIVE }),
    Group.countDocuments({ isDeleted: { $ne: true } }) // Unfiltered total groups
  ]);

  return {
    data,
    meta,
    totalGroups,
    activeGroups,
    upcomingGroups,
    totalMembers: uniqueMembers.length,
  };
};

const getGroupById = (id: string) =>
  Group.findById(id).populate("createdBy", "firstName lastName email").lean();

const updateGroupStatus = async (id: string, status: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (status === GroupStatus.ACTIVE) {
      await GroupServices.checkMembersPaymentMethods(id);
    }

    const updated = await Group.findByIdAndUpdate(id, { status }, { new: true, session });
    if (updated) {
      await logActivity(id, "GROUP_STATUS_UPDATED", `Group status updated to ${status} by Admin.`, session);

      // Notify Creator
      const title = "Group Status Updated";
      const body = `Your group "${updated.name}" status has been updated to ${status}.`;
      
      const creatorId = updated.createdBy.toString();

      emitRealTimeNotification(creatorId, title, body, { groupId: id, status });
      enqueuePushNotification(creatorId, title, body, { groupId: id, status });

      // Internal Notification Record for Creator
      await Notification.create([{
        userId: updated.createdBy,
        title,
        message: body,
        type: NotificationType.NEW_MESSAGE
      }], { session });
    }

    await session.commitTransaction();
    return updated;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const AdminGroupServices = {
  getAllGroups,
  getGroupById,
  updateGroupStatus,
};
