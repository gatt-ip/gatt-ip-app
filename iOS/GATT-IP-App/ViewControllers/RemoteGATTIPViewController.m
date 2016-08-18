/* The MIT License
 
 Copyright (c) 2010-2014 Vensi, Inc. http://gatt-ip.org
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

#import "LogViewController.h"
#import "RemoteGATTIPViewController.h"
#import "Reachability.h"
#import "CoreWebSocket.h"
#import "GATTIP.h"
#import "Logs.h"

@interface RemoteGATTIPViewController () <GATTIPDelegate> {
    GATTIPAppDelegate *appDelegate;
    WebSocketRef webSocket;
    Logs *logs;
}
@property(nonatomic, strong) GATTIP *gattip;
@end

@implementation RemoteGATTIPViewController
- (void)viewDidLoad {
    [super viewDidLoad];
    logs = [Logs sharedSingleton];
    int portNumber = [_port intValue];
    webSocket = WebSocketCreateWithHostAndPort(NULL,(__bridge CFStringRef)@"localhost",portNumber, (__bridge void *)(self));
    appDelegate = (GATTIPAppDelegate *)[[UIApplication sharedApplication] delegate];
    _topHeader.backgroundColor = [self colorWithHexString:@"063b63"];
    _gattip = [[GATTIP alloc] init];
    [_gattip setDelegate:self];
    
    if (webSocket) {
        dispatch_async(dispatch_get_main_queue(), ^{
            webSocket->callbacks.didClientReadCallback = Callback1;
        });
    }
}

void Callback1 (WebSocketRef sockref, WebSocketClientRef client, CFStringRef value) {
    if (!value) {
        return;
    }
    NSLog(@"Request: %@",value);
    NSString *stringValue = (__bridge NSString *)value ;
    NSData *stringValueData = [stringValue dataUsingEncoding:NSUTF8StringEncoding];
    [(__bridge GATTIP *)sockref->userInfo request:stringValueData];
}

- (void)request:(NSData *)gattipMesg {
    [logs addMessagesToLog:gattipMesg];
    [_gattip request:gattipMesg];
}

- (void)response:(NSData *)gattipMesg {
    [logs addMessagesToLog:gattipMesg];
    NSString  *responseString = [[NSString alloc]initWithData:gattipMesg encoding:NSUTF8StringEncoding];
    NSLog(@"Response: %@",responseString);
    WebSocketWriteWithString(webSocket, (__bridge CFStringRef)(responseString));
}

-(void)viewDidAppear:(BOOL)animated
{
    [super viewDidAppear:animated];
    if([appDelegate checkReachability] == NotReachable) {
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"No Network" message:@"There is no network, which is required to connect to the remote server." delegate:self cancelButtonTitle:@"Ok" otherButtonTitles:nil, nil];
        [alert show];
        return;
    }
    [_portLbl setText: [NSString stringWithFormat:@"Port Number : %@",_port]];
    [_ipAddrLbl setText:[NSString stringWithFormat:@"IP Address : %@",_ipAddr]];
    [_portLbl setTextColor:[self colorWithHexString:@"063b63"]];
    [_ipAddrLbl setTextColor:[self colorWithHexString:@"063b63"]];
}

- (IBAction)gotoLocal:(id)sender
{
    WebSocketRelease(webSocket);
    [self dismissViewControllerAnimated:YES completion:nil];
}

-(IBAction)gotoLog:(id)sender
{
    UIStoryboard *storyBoard = [UIStoryboard storyboardWithName:@"Main" bundle:nil];
    LogViewController *logViewController = (LogViewController *)[storyBoard instantiateViewControllerWithIdentifier:@"logVC"];
    logViewController.modalTransitionStyle = UIModalTransitionStyleFlipHorizontal;
    [self showViewController:logViewController sender:self];
}

#pragma mark - color code to string
//converting hex color to string
-(UIColor*)colorWithHexString:(NSString*)hex
{
    NSString *cString = [[hex stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]] uppercaseString];
    
    // String should be 6 or 8 characters
    if ([cString length] < 6) return [UIColor grayColor];
    
    // strip 0X if it appears
    if ([cString hasPrefix:@"0X"]) cString = [cString substringFromIndex:2];
    
    if ([cString length] != 6) return  [UIColor grayColor];
    
    // Separate into r, g, b substrings
    NSRange range;
    range.location = 0;
    range.length = 2;
    NSString *rString = [cString substringWithRange:range];
    
    range.location = 2;
    NSString *gString = [cString substringWithRange:range];
    
    range.location = 4;
    NSString *bString = [cString substringWithRange:range];
    
    // Scan values
    unsigned int r, g, b;
    [[NSScanner scannerWithString:rString] scanHexInt:&r];
    [[NSScanner scannerWithString:gString] scanHexInt:&g];
    [[NSScanner scannerWithString:bString] scanHexInt:&b];
    
    return [UIColor colorWithRed:((float) r / 255.0f)
                           green:((float) g / 255.0f)
                            blue:((float) b / 255.0f)
                           alpha:1.0f];
}

@end
