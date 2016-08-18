//
//  Logs.m
//  GATT-IP-App
//
//  Created by Vensi Developer on 10/9/15.
//  Copyright © 2015 Vensi Developer. All rights reserved.
//

#import "Logs.h"
#import "GATTIP.h"

@implementation Logs
NSInteger MAX_NUMBER_OF_REQUESTS = 60 ;
NSMutableArray *previousRequests;

static Logs* _sharedSingleton = nil;

+(Logs*)sharedSingleton
{
    @synchronized([Logs class])
    {
        if (!_sharedSingleton)
           _sharedSingleton = [[Logs alloc] init];
    }
    return _sharedSingleton;
}

- (id)init {
    previousRequests = [NSMutableArray new];
    return self;
}

- (void)handleLoggingRequestAndResponse:(NSDictionary *)input
{
    if(previousRequests.count > MAX_NUMBER_OF_REQUESTS)
    {
        NSIndexSet *setOfIndeciesToRemove = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0,floor(MAX_NUMBER_OF_REQUESTS/4.0f))];
        [previousRequests removeObjectsAtIndexes:setOfIndeciesToRemove];
    }
    [previousRequests addObject:[self convertToHumanReadableFormat:input]];
}

- (NSArray *)listOFResponseAndRequests
{
    return previousRequests;
}

#pragma mark - Helpers
/**
 *  Converts the hex string fields to the
 *
 *  @param input (the input Dictionary from which the human Readable Dictionary is going to be formed from
 *
 *  @return the dictionary which is converted to the human Readable Format.
 */
- (NSMutableDictionary *)convertToHumanReadableFormat:(NSDictionary *)input
{
    NSMutableDictionary *outputRespnose = [NSMutableDictionary new];
    NSArray *allKeysForResponse = [input allKeys];
    NSString *humanReadableKey ;
    //convert all the keys(keys that don't need conversion will just stay the same since they are setup in that way in the humanReadableFormatFromHex dic
    //we also convert the values that need conversion while we convert the keys.
    for (NSString *key in allKeysForResponse)
    {
        id value = [input objectForKey:key];
        humanReadableKey = [self humanReadableFormatFromHex:key];
        if([value isKindOfClass:[NSString class]])
        {
            NSString *humanReadableValue = value;
            humanReadableValue =  [self humanReadableFormatFromHex:value];
            [outputRespnose setObject:humanReadableValue forKey:humanReadableKey];
        }
        else if([value isKindOfClass:[NSDictionary class]])
        {
            NSDictionary *humanReadableValue ;
            humanReadableValue = [self convertToHumanReadableFormat:value];
            [outputRespnose setObject:humanReadableValue forKey:humanReadableKey];
        }
        else
        {
            NSDictionary *humanReadableValue  = value;
            [outputRespnose setObject:humanReadableValue forKey:humanReadableKey];
        }
    }
    return outputRespnose;
}

- (NSString *)humanReadableFormatFromHex:(NSString *)hexString
{
    NSDictionary *methods =  @{kConfigure:@"Configure",
                               kScanForPeripherals:@"ScanForPeripherals",
                               kStopScanning:@"StopScanning",
                               kConnect:@"Connect",
                               kDisconnect:@"Disconnect",
                               kCentralState:@"CentralState",
                               kGetConnectedPeripherals:@"GetConnectedPeripherals",
                               kGetPerhipheralsWithServices:@"GetPerhipheralsWithServices",
                               kGetPerhipheralsWithIdentifiers:@"GetPerhipheralsWithIdentifiers",
                               kGetServices:@"GetServices",
                               kGetIncludedServices:@"GetIncludedServices",
                               kGetCharacteristics:@"GetCharacteristics",
                               kGetDescriptors:@"GetDescriptors",
                               kGetCharacteristicValue:@"GetCharacteristicValue",
                               kGetDescriptorValue:@"GetDescriptorValue",
                               kWriteCharacteristicValue:@"WriteCharacteristicValue",
                               kWriteDescriptorValue :@"WriteDescriptorValue",
                               kSetValueNotification:@"SetValueNotification",
                               kGetPeripheralState:@"GetPeripheralState",
                               kGetRSSI:@"GetRSSI",
                               kInvalidatedServices:@"InvalidatedServices",
                               kPeripheralNameUpdate:@"peripheralNameUpdate",
                               };
    NSDictionary *keys = @{kCentralUUID:@"centralUUID",
                           kPeripheralUUID:@"peripheralUUID",
                           kPeripheralName:@"PeripheralName",
                           kPeripheralUUIDs:@"PeripheralUUIDs",
                           kServiceUUID:@"ServiceUUID",
                           kServiceUUIDs:@"ServiceUUIDs",
                           kPeripherals:@"peripherals",
                           kIncludedServiceUUIDs:@"IncludedServiceUUIDs",
                           kCharacteristicUUID:@"CharacteristicUUID",
                           kCharacteristicUUIDs:@"CharacteristicUUIDs",
                           kDescriptorUUID:@"DescriptorUUID",
                           kServices:@"Services",
                           kCharacteristics:@"Characteristics",
                           kDescriptors:@"Descriptors",
                           kProperties:@"Properties",
                           kValue :@"Value",
                           kState:@"State",
                           kStateInfo:@"StateInfo",
                           kStateField:@"StateField",
                           kWriteType:@"WriteType",
                           kRSSIkey:@"RSSIkey",
                           kIsPrimaryKey:@"IsPrimaryKey",
                           kIsBroadcasted:@"IsBroadcasted",
                           kIsNotifying:@"IsNotifying",
                           kShowPowerAlert:@"ShowPowerAlert",
                           kIdentifierKey:@"IdentifierKey",
                           kScanOptionAllowDuplicatesKey:@"ScanOptionAllowDuplicatesKey",
                           kScanOptionSolicitedServiceUUIDs:@"ScanOptionSolicitedServiceUUIDs",
                           kAdvertisementDataKey:@"AdvertisementDataKey",
                           kCBAdvertisementDataManufacturerDataKey:@"CBAdvertisementDataManufacturerDataKey",
                           kCBAdvertisementDataServiceUUIDsKey:@"CBAdvertisementDataServiceUUIDsKey",
                           kCBAdvertisementDataServiceDataKey:@"CBAdvertisementDataServiceDataKey",
                           kCBAdvertisementDataOverflowServiceUUIDsKey:@"CBAdvertisementDataOverflowServiceUUIDsKey",
                           kCBAdvertisementDataSolicitedServiceUUIDsKey:@"CBAdvertisementDataSolicitedServiceUUIDsKey",
                           kCBAdvertisementDataIsConnectable:@"CBAdvertisementDataIsConnectable",
                           kCBAdvertisementDataTxPowerLevel:@"CBAdvertisementDataTxPowerLevel",
                           kCBCentralManagerRestoredStatePeripheralsKey:@"CBCentralManagerRestoredStatePeripheralsKey",
                           kCBCentralManagerRestoredStateScanServicesKey:@"CBCentralManagerRestoredStateScanServicesKey",
                           kPeripheralBtAddress:@"BTAddress",
                           kRawAdvertisementData:@"RawAdvertisingData",
                           kScanRecord:@"ScanRecord"
                           };
    
    NSDictionary *values = @{kWriteWithResponse:@"WriteWithResponse",
                             kWriteWithoutResponse:@"WriteWithoutResponse",
                             kNotifyOnConnection :@"NotifyOnConnection",
                             kNotifyOnDisconnection:@"NotifyOnDisconnection",
                             kNotifyOnNotification:@"NotifyOnNotification",
                             kDisconnected :@"Disconnected",
                             kConnecting:@"Connecting",
                             kConnected:@"Connected",
                             kUnknown :@"Unknown",
                             kResetting:@"Resetting",
                             kUnsupported:@"Unsupported",
                             kUnauthorized:@"Unauthorized",
                             kPoweredOff:@"PoweredOff",
                             kPoweredOn:@"PoweredOn"};
    
    if([methods valueForKey:hexString])
    {
        return [methods valueForKey:hexString];
    }
    else if ([keys valueForKey:hexString])
    {
        return [keys valueForKey:hexString];
    }
    else if([values valueForKey:hexString])
    {
        return [values valueForKey:hexString];
    }
    
    return hexString ? hexString : @"";
}

- (NSDictionary *)getMessageDict : (NSData *)gattipMesg
{
    NSError *jsonError = nil;
    id requests = [NSJSONSerialization JSONObjectWithData:gattipMesg options:0 error:&jsonError];
    if([requests isKindOfClass:[NSDictionary class]])
    {
        requests = [NSArray arrayWithObject:requests];
    }
    
    for(NSDictionary *request in requests) {
        return request;
    }
    return NULL;
}

- (void)addMessagesToLog : (NSData *)message
{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"GotNewMessage" object: nil];
    NSDictionary *responseDict =  [self getMessageDict:message];
    [self handleLoggingRequestAndResponse:responseDict];
}

@end
