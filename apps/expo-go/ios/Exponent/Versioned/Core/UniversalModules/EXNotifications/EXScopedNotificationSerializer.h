// Copyright 2018-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>
#import <EXNotifications/EXNotificationSerializer.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedNotificationSerializer : EXNotificationSerializer

+ (NSDictionary<NSString *, NSObject *> *)serializedNotificationResponse:(UNNotificationResponse *)response;
+ (NSDictionary<NSString *, NSObject *> *)serializedNotification:(UNNotification *)notification;

@end

NS_ASSUME_NONNULL_END
