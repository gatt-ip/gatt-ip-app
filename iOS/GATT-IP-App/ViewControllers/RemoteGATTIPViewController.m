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

#import "GATTIP.h"
#import "SRWebSocket.h"
#import "LogViewController.h"
#import "RemoteGATTIPViewController.h"

@interface RemoteGATTIPViewController () <GATTIPDelegate,SRWebSocketDelegate,UITextFieldDelegate>
{
    GATTIPAppDelegate *appDelegate;
}
@property (weak, nonatomic) IBOutlet UILabel *connectionStateLabel;
@property(nonatomic, strong)GATTIP *gattip;
@property(nonatomic, strong)SRWebSocket *srWebSocket;

@end

@implementation RemoteGATTIPViewController

- (void)viewDidLoad
{
    [super viewDidLoad];
    appDelegate = (GATTIPAppDelegate *)[[UIApplication sharedApplication] delegate];
    [_locationTextField setPlaceholder:@"ws://<hostname>:<port>"];
    _locationTextField.delegate = self;
    _topHeader.backgroundColor = [self colorWithHexString:@"063b63"];
}

-(void)viewDidAppear:(BOOL)animated
{
    [_locationTextField becomeFirstResponder];
}

#pragma mark TextFieldDelegate
- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
    [self.view endEditing:YES];
    [super touchesBegan:touches withEvent:event];
}

-(BOOL)textFieldShouldReturn:(UITextField*)textField;
{
    [textField resignFirstResponder];
    return YES;
}

- (IBAction)connectWebSocket:(id)sender
{
    NSString *state = _connectBtn.titleLabel.text;
    if([state isEqualToString:@"Connect"])
    {
        if([_locationTextField.text isEqualToString:@""])
        {
            [appDelegate showAlert:@"Please enter Host Name or IP address." withTitle:@""];
            return;
        }
        
        if(![self validateUrl:_locationTextField.text])
        {
            [appDelegate showAlert:@"Invalid Address. Please enter a valid HOST or IP Address" withTitle:nil];
            return;
        }
        
        
        if([appDelegate checkReachability] != NotReachable){
            _srWebSocket = [[SRWebSocket alloc] initWithURL:[NSURL URLWithString:_locationTextField.text]];
            _srWebSocket.delegate = self;
            [_srWebSocket open];
            
            _gattip = [[GATTIP alloc] init];
            [_gattip setDelegate:self];
            
            [UIApplication sharedApplication].idleTimerDisabled = YES;
            
        }else{
            [appDelegate showAlert:@"There is no network, which is required to connect to the remote server." withTitle:@"No Network"];
        }
    } else if([state isEqualToString:@"Disconnect"])
    {
        [_srWebSocket close];
        
        [UIApplication sharedApplication].idleTimerDisabled = NO;
    }
}

- (IBAction)gotoLocal:(id)sender
{
    _srWebSocket.delegate = nil;
    [_srWebSocket close];
    _srWebSocket = nil;
    [self dismissViewControllerAnimated:YES completion:nil];
}

-(IBAction)gotoLog:(id)sender
{
    NSArray *listOfHumanReadableValues =  [_gattip listOFResponseAndRequests];
    UIStoryboard *storyBoard = [UIStoryboard storyboardWithName:@"Main" bundle:nil];
    LogViewController *logViewController = (LogViewController *)[storyBoard instantiateViewControllerWithIdentifier:@"logVC"];
    logViewController.modalTransitionStyle = UIModalTransitionStyleFlipHorizontal;
    logViewController.logList = listOfHumanReadableValues;
    [self showViewController:logViewController sender:self];
}

-(void)response:(NSData *)gattipMesg
{
    NSString *gattipResponse =  [[NSString alloc] initWithData:gattipMesg encoding:NSUTF8StringEncoding];
    NSLog(@"Response: %@)", gattipResponse);
    
    if(_srWebSocket){
        [_srWebSocket send:gattipResponse];
    }
}

#pragma mark - _srWebSocketDelegate
- (void)webSocketDidOpen:(SRWebSocket *)webSocket
{
    [_connectBtn setTitle:@"Disconnect" forState:UIControlStateNormal];
    [_connectBtn setTitleColor:[self colorWithHexString:@"F78F1E"] forState:UIControlStateNormal];
}

- (void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error
{
    _srWebSocket = nil;
    _gattip = nil;
    
    [appDelegate showAlert:@"An error occured. Please try again." withTitle:nil];

    [_connectBtn setTitle:@"Connect" forState:UIControlStateNormal];
    [_connectBtn setTitleColor:[self colorWithHexString:@"005cff"] forState:UIControlStateNormal];
}

- (void)webSocket:(SRWebSocket *)webSocket didReceiveMessage:(id)message
{
    NSLog(@"Request: %@", message);
    if(_gattip) {
        [_gattip request:[(NSString*)message dataUsingEncoding:NSUTF8StringEncoding]];
    }
}

- (void)webSocket:(SRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean
{
    _srWebSocket = nil;
    _gattip = nil;
    
    UIAlertView *alertMessage = [ [UIAlertView alloc] initWithTitle:nil
                                                            message:@"Conection Closed."
                                                           delegate:nil
                                                  cancelButtonTitle:@"OK"
                                                  otherButtonTitles:nil];
    [alertMessage show];
    
    [_connectBtn setTitle:@"Connect" forState:UIControlStateNormal];
    [_connectBtn setTitleColor:[self colorWithHexString:@"005cff"] forState:UIControlStateNormal];
}

-(BOOL)validateUrl:(NSString *)candidate
{
    NSString *regexString = @"(ws|wss)://((\\w)*|([0-9]*)|([-|_])*)+([\\.|:]((\\w)*|([0-9]*)|([-|_])*))+";
    NSPredicate *urlTest = [NSPredicate predicateWithFormat:@"SELF MATCHES %@", regexString];
    return [urlTest evaluateWithObject:candidate];
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
