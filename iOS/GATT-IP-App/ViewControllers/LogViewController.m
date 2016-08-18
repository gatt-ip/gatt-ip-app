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
#import  <MessageUI/MessageUI.h>

#define TEXT_VIEW_TAG 33

@interface LogViewController()<MFMailComposeViewControllerDelegate>
@property (weak, nonatomic) IBOutlet UITextView *textView;
@property  UIBarButtonItem *emailSupport;
@end

@implementation LogViewController
- (void)viewDidAppear:(BOOL)animated
{
    [super viewDidAppear:YES];
    [self  reloadView];
    [[NSNotificationCenter defaultCenter] addObserver: self selector: @selector(reloadView) name: @"GotNewMessage" object: nil];
}

- (IBAction)goBack:(id)sender {
    [self dismissViewControllerAnimated:YES completion:^(void){}];
}

- (IBAction)email:(UIButton *)sender {
    NSString *iOSVersion = [[UIDevice currentDevice] systemVersion];
    NSString *model = [[UIDevice currentDevice] model];
    NSString *version = @"1.0";
    NSString *build = @"100";
    if(![MFMailComposeViewController canSendMail])
    {
        UIAlertView *alertMessage = [ [UIAlertView alloc]
                                     initWithTitle:@"Warning"
                                     message:@"Please Configure an email account before trying to send an email."
                                     delegate:nil
                                     cancelButtonTitle:@"Ok"
                                     otherButtonTitles:nil];
        [alertMessage show];
        
        return;
    }
    MFMailComposeViewController *mailComposer = [[MFMailComposeViewController alloc] init];

    mailComposer.mailComposeDelegate = self;
    [mailComposer setToRecipients:[NSArray arrayWithObjects: @"",nil]];
    [mailComposer setSubject:[NSString stringWithFormat: @"Readable Data -%@, %@",version,build]];
    NSString *supportText = [NSString stringWithFormat:@"Device: %@\niOS Version:%@\n\n",model,iOSVersion];
    supportText = [supportText stringByAppendingString: @"Please describe your problem or question."];
    NSMutableString   *allLogs = [NSMutableString new];
    for (NSString *loggedRequestResponse in self.logList)
    {
        
        [allLogs appendString:loggedRequestResponse.description];
        [allLogs appendString:@"\n-------------------------------\n"];
    }
    supportText = [supportText stringByAppendingString:allLogs];
    [mailComposer setMessageBody:supportText isHTML:NO];
    [self presentViewController:mailComposer animated:YES completion:nil];
}

- (void)mailComposeController:(MFMailComposeViewController *)controller didFinishWithResult:(MFMailComposeResult)result error:(NSError *)error
{
    [self dismissViewControllerAnimated:YES completion:nil];
}

-(void)reloadView
{
    NSMutableString *currentString = [NSMutableString new];
    for (NSDictionary *aLog in self.logList)
    {
        NSString *logString = [NSString stringWithFormat:@"%@ \n============================= \n \n ",[aLog description]];
        [currentString appendString:logString];
    }
    dispatch_async(dispatch_get_main_queue(), ^{
        self.textView.text = currentString;
    });
}

@end
