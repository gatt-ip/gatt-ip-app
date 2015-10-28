//
//  Logs.h
//  GATT-IP-App
//
//  Created by Vensi Developer on 10/9/15.
//  Copyright © 2015 Vensi Developer. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface Logs : NSObject
+(Logs*)sharedSingleton;
- (void)handleLoggingRequestAndResponse:(NSDictionary *)input;
- (NSArray *)listOFResponseAndRequests;
- (NSDictionary *)getMessageDict : (NSData *)gattipMesg;
- (void)addMessagesToLog : (NSData *)message;
@end
