import { DatePipe, formatDate } from "@angular/common";
import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  Input,
  ViewChild,
} from "@angular/core";
import {
  DataStateChangeEvent,
  GridDataResult,
  PageSizeItem,
  SelectableSettings,
  GridComponent,
  SelectAllCheckboxState,
  PageChangeEvent,
} from "@progress/kendo-angular-grid";
import { State, process } from "@progress/kendo-data-query";
import { AlertDashboardService } from "app/main/dashboard/alertdashboard/alert-dashboard.service";
import {
  AlertDashboardSearch,
  SearchOthercriteria,
  SearchOtherCriteria,
} from "app/main/dashboard/alertdashboardnew/alertdashboard.model";
import { AlertdashboardbrokerService } from "app/main/dashboard/alertdashboardnew/alertdashboardbroker.service";
import { AlertdashboardnewComponent } from "app/main/dashboard/alertdashboardnew/alertdashboardnew.component";
import { TaskdashboardbrokerService } from "app/main/dashboard/tasksdashboard/taskdashboardbroker.service";
import { AuthenticationService } from "app/main/services/authentication.service";
import { NotificationService } from "app/main/shared/notification.service";
import { ExcelService } from "app/common/excel.service";
import { SystemConfigurationService } from "app/main/systemconfiguration/system-configuration.service";
import { NgxSpinnerService } from "ngx-spinner";
import * as lodash from "lodash";
import * as signalR from "@microsoft/signalr";
import { of, Observable, Subject } from "rxjs";
import { anyChanged } from "@progress/kendo-angular-common";
import { ExcelExportData } from "@progress/kendo-angular-excel-export";
import { CommonserviceService } from "app/main/shared/commonservice.service";
import { DialogService, DialogRef } from "@progress/kendo-angular-dialog";
import { ClientConfigurationService } from "app/main/clientconfiguaration/client-configuration.service";
import * as html2canvas from "html2canvas";
import { drawDOM, exportImage, Group, Path } from "@progress/kendo-drawing";
import { saveAs, encodeBase64 } from "@progress/kendo-file-saver";
import { PDFExportComponent } from "@progress/kendo-angular-pdf-export";
import { EventListenerFocusTrapInertStrategy } from "@angular/cdk/a11y";
import { environment } from "environments/environment";
import { AlertlocationmapComponent } from "../../tasksdashboard/alertdetails/alertlocationmap/alertlocationmap.component";
import { settings } from "cluster";
import { EcbcallboxService } from "../../../ecb/ecbcallbox.service";

@Component({
  selector: "ngx-alertslistview",
  encapsulation: ViewEncapsulation.None,
  templateUrl: "./alertslistview.component.html",
  styleUrls: ["./alertslistview.component.scss"],
})
export class AlertslistviewComponent implements OnInit, OnDestroy {
  @ViewChild("grid", { static: false }) grid: GridComponent;

  private connection: signalR.HubConnection;
  private channelName = "alert";
  private methodName = "ALERT";
  public acknowledgeAlertzone = false;
  public boxActionFlag = "";
  public gridData: GridDataResult;
  public finalGridData: any[];
  public objAlertDashboardSearch: AlertDashboardSearch;
  public gridDataNew: any;
  public AlertDashboardList = [];
  public AlertDashboardListtemp: any;
  public AlertDashboardmapList: any;
  public hiddenFields: any[] = [];
  public currentcontexmenu: number = -1;
  public currentDataItem: any;
  public selectlist: number = 1;
  public selectAllState: SelectAllCheckboxState = "unchecked";
  public selectableSettings: SelectableSettings;
  public mySelection: number[] = [];
  public selectflag: number = 0;
  public selectedAlertid: any = [];
  public RemoveselectedAlertid: any = [];
  public tempselectedAlertid: any = [];
  public formidremove: any = [];
  public singleAlertid: number = 0;
  public form4id: number = 0;
  public selectAlertType: number = 0;
  public totalCounts = 0;
  any;
  public alerttypelist: Array<{ name: string; Id: number }> = [
    { name: "Alerts", Id: 1 },
    { name: "Events", Id: 2 },
    { name: "KPI Violations", Id: 3 },
    // ,{ name: "Grievances", Id: 4 }
  ];
  public MaxDate: any = new Date();
  public selectedalerttype: { name: string; Id: number } = {
    name: "Alerts",
    Id: 1,
  };
  public selecteddomain: any[] = [];
  public selectedboundary: any[] = [];
  public severitylist: any[] = [];
  public selectedseverity: any[] = [];
  public selectedstatus: any[] = [];
  public owneroncurrentlist: any[] = [];
  public selectedowneroncurrent: any[] = [];
  public fromdatevalue: Date = new Date();
  public todatevalue: Date = new Date();
  public fields: string[] = [];
  public owneroncurrentlisttemp: any[] = [];
  public boundarylist: any[];
  // public domainlist: Array<{ name: string; domainid: number }>;
  public domainlist = [];
  // public alertnamelist: Array<{ alertname: string; incidentid: number }>;
  public alertnamelist = [];
  public selectedalertname: any[] = [];
  public isRedirected = false;
  public datetimeFormat;
  public dateFormat;
  public format = "dd/MM/yyyy";
  public statuslist: Array<{ statusname: string; id: number }>;
  public isAdmin: boolean = false;
  public pageSize = 10;
  public skip = 0;
  public todaydate = new Date();
  public pageSizes: PageSizeItem[] = [
    {
      text: "10",
      value: 10,
    },
    {
      text: "20",
      value: 20,
    },
    {
      text: "50",
      value: 50,
    },
    {
      text: "100",
      value: 100,
    },
  ];
  public state: State = {
    skip: 0,
    take: 20,
  };
  public domainidvalue: any[] = [];
  public incidentids: any[] = [];

  public currentstatusvalue: any[] = [];
  intervalId: any;
  changingMenuStateValue: Subject<string> = new Subject();

  constructor(
    @Inject(AlertdashboardnewComponent)
    private parentCom: AlertdashboardnewComponent,
    public alertdashboardbroker: AlertdashboardbrokerService,
    private notifyService: NotificationService,
    private datepipe: DatePipe,
    private spinner: NgxSpinnerService,
    private systemService: SystemConfigurationService,
    private authenticationService: AuthenticationService,
    private excelService: ExcelService,
    private dialogService: DialogService,
    public AlertService: AlertDashboardService,
    private authenticationservice: AuthenticationService,
    private taskDashboardService: TaskdashboardbrokerService,
    private clientService: ClientConfigurationService,
    public commonservice: CommonserviceService,
    private AlertlocationmapComponent: AlertlocationmapComponent,
    private ecbCallBoxService: EcbcallboxService
  ) {
    this.allData = this.allData.bind(this);
    this.selectableSettings = {
      checkboxOnly: true,
      mode: "single",
      drag: false,
    };
  }

  public UserName: any = this.authenticationService.currentUserValue.userName;
  public ReportDate: any = new Date();

  @Input()
  checkedKeys: number;

  ngOnInit(): void {
    localStorage.setItem("requestTime", new Date().toISOString());

    this.getSystemDateTimeFormate();
    this.getFilterData();
    this.loadclientLogo();

    this.spinner.show();

    //For Single Alert Redirect
    const alertId = localStorage.getItem("livedsalertid");
    const domainId = localStorage.getItem("livedsdomainid");
    const alertTypeId = localStorage.getItem("aetype");
    const fromAlertDashboard = localStorage.getItem("fromAlertDashboard");
    const alertDate = localStorage.getItem("alertDate");

    localStorage.removeItem("fromAlertDashboard");
    localStorage.removeItem("livedsalertid");
    localStorage.removeItem("livedsdomainid");
    localStorage.removeItem("aetype");

    if (domainId != null && alertTypeId != null) {
      this.isRedirected = true;

      if (fromAlertDashboard == "true" && alertDate != null) {
        this.searchDate = new Date(alertDate);
        this.alertdashboardbroker.AlertDate = this.searchDate;
        this.lockObj.date = this.searchDate.toISOString();
        // this.isRedirected = alertId != null ? true : false;
        this.isRedirected = false;
      }
      this.lockObj.domainIds = [Number(domainId)];
      this.getAlertListData(
        undefined,
        undefined,
        true,
        alertId != null ? Number(alertId) : null
      );
    } else {
      this.lockObj.date = this.searchDate.toISOString();
      this.getAlertListData(this.state.take * 4, 0, true);
    }

    // signelR code
    this.startConnection();

    // if (!this.isRedirected) {
    //   this.startConnection();
    // }

    // this.intervalId = setInterval(() => {
    //   const domainId = localStorage.getItem("domainId");
    //   const alertTypeId = localStorage.getItem("alertTypeId");

    //   if (domainId != null && alertTypeId != null) {
    //     // Do nothing or perform some action
    //   } else {
    //     localStorage.setItem("requestTime", new Date().toISOString());
    //     this.getAlertListData(this.state.take * 4, 0, true, undefined, false);
    //   }
    // }, 5000);
  }


  private getSystemDateTimeFormate() {
    this.datetimeFormat =
      this.authenticationService.currentUserValue.datetimeformat;
    this.datetimeFormat = this.datetimeFormat
      .replaceAll("D", "d")
      .replaceAll("Y", "y");
    this.dateFormat = this.authenticationService.currentUserValue.dateformat;
    this.dateFormat = this.dateFormat.replaceAll("D", "d").replaceAll("Y", "y");

    this.isAdmin =
      this.authenticationService.currentUserValue.userRole.toLowerCase() ==
      "ClientAdminRole";
    // const dateStr = localStorage.getItem("Domaindate");
    // if (dateStr && dateStr != null) {
    //   this.alertdashboardbroker.AlertDate = new Date(dateStr);
    //   localStorage.removeItem("Domaindate");
    // } else {
    //   this.alertdashboardbroker.AlertDate = new Date();
    // }
  }

  public open(dataItem: any) {
    this.alertdashboardbroker.alertdata = dataItem;
    this.opened = true;
  }

  public opened = false;
  public close(status) {
    this.opened = false;
    this.alertdashboardbroker.alertdata = null;
  }

  ngOnDestroy(): void {
    this.connection.off(this.methodName);
    this.connection.stop();
    this.alertdashboardbroker.summaryalerttype = null;
    this.alertdashboardbroker.summarydomain = null;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  ngAfterContentInit(): void {
    $(".ng-star-inserted").removeClass("active");

    if ($(".ng-tns-c118-5 .ng-star-inserted")[0].title == "Alert Dashboard")
      $(".ng-tns-c118-5 .ng-star-inserted").addClass("active");
    else if (
      $(".ng-tns-c118-4 .ng-star-inserted")[0].title == "Alert Dashboard"
    )
      $(".ng-tns-c118-4 .ng-star-inserted").addClass("active");
    else if (
      $(".ng-tns-c118-2 .ng-star-inserted")[0].title == "Alert Dashboard"
    )
      $(".ng-tns-c118-2 .ng-star-inserted").addClass("active");
    else if (
      $(".ng-tns-c118-3 .ng-star-inserted")[0].title == "Alert Dashboard"
    )
      $(".ng-tns-c118-3 .ng-star-inserted").addClass("active");
  }
  public rowClass = (args) => ({
    "k-state-disabled": !args.dataItem.rightsdetails.isabletoacknowledge,
  });

  public setSelect(selectiontype) {
    //'checked'
    //console.log(selectiontype);
    if (this.selectflag == 0) {
      this.selectflag = 1;
      return;
    }
    if (this.selectflag == 1 || this.selectflag == 2) {
      this.selectAllState = "unchecked";
      this.formidremove = [];
      this.selectedAlertid = [];
      this.tempselectedAlertid = [];
      this.RemoveselectedAlertid = [];
      this.mySelection = [];
      this.selectflag = 0;
      return;
    }
  }

  public onSelectedKeysChange(e) {
    this.RemoveselectedAlertid = [];
    this.tempselectedAlertid = [];
    this.selectedAlertid = [];
    let len = this.mySelection.length;
    if (len == 1) {
      this.form4id = e;
      for (var i = 0; i < this.finalGridData.length; i++) {
        if (this.finalGridData[i].alertdetailsid == e) {
          this.singleAlertid = this.finalGridData[i].alertdetailsid;
        }
      }
    }
    if (len > 0) {
      this.tempselectedAlertid = e;
      if (this.selectflag == 1) {
        //Select All Clicked for that Manual code.
        for (var selind = 0; selind < this.finalGridData.length; selind++) {
          //var myAlertData = this.finalGridData.filter(x => x.alertdetailsid == this.tempselectedAlertid[selind]);
          //if(myAlertData.length>0)
          {
            if (this.finalGridData[selind].rightsdetails.isabletoacknowledge) {
              this.selectedAlertid.push(
                this.finalGridData[selind].alertdetailsid
              );
            } else {
              this.RemoveselectedAlertid.push(
                this.finalGridData[selind].alertdetailsid
              );
            }
          }
        }
      } else {
        for (
          var selind = 0;
          selind < this.tempselectedAlertid.length;
          selind++
        ) {
          var myAlertData = this.finalGridData.filter(
            (x) => x.alertdetailsid == this.tempselectedAlertid[selind]
          );
          if (myAlertData.length > 0) {
            if (myAlertData[0].rightsdetails.isabletoacknowledge) {
              this.selectedAlertid.push(this.tempselectedAlertid[selind]);
            } else {
              this.RemoveselectedAlertid.push(this.tempselectedAlertid[selind]);
            }
          }
        }
      }
    }
    this.mySelection = this.selectedAlertid;
    if (this.mySelection.length == 0) {
      this.selectAllState = "unchecked";
      this.formidremove = [];
      this.selectedAlertid = [];
      this.tempselectedAlertid = [];
      this.RemoveselectedAlertid = [];
      this.selectflag = 0;
    }

    len = this.mySelection.length;
    this.formidremove = e;
    if (len === 0) {
      this.selectAllState = "unchecked";
      this.selectflag = 0;
    } else if (len > 0 && len < this.finalGridData.length) {
      this.selectAllState = "indeterminate";
      this.selectflag = 2;
    } else {
      this.selectAllState = "checked";
      this.selectflag = 2;
    }
  }

  public AuthenticateAll() {
    if (this.selectedAlertid.length > 0) {
      var myAlertData = this.finalGridData.filter(
        (x) => x.alertdetailsid == this.selectedAlertid[0]
      );
      if (myAlertData.length > 0) {
        this.selectAlertType = myAlertData[0].alerttype;
        this.notifyService
          .showConfirmation(
            "Are you sure ?",
            "Do you want to acknowledge all the selected alerts?",
            "Yes",
            "No"
          )
          .then((res) => {
            this.spinner.show();
            this.alertdashboardbroker
              .PostMultipleAlertAcknowledge(
                this.selectedAlertid.toString(),
                this.selectAlertType
              )
              .subscribe(
                (form: any) => {
                  if (form.result) {
                    if (form.result && form.result == 1) {
                      this.notifyService.showSuccess(
                        "Selected alerts acknowledged successfully",
                        "Success"
                      );
                      this.Searchalert();
                      //this.getAlertListData();
                      //this.ResetValues();
                      this.spinner.hide();
                    } else {
                      this.notifyService.showWarning(
                        "Something went wrong",
                        "Warning"
                      );
                      this.Searchalert();
                      // this.getAlertListData();
                      // this.ResetValues();
                      this.spinner.hide();
                    }
                  } else {
                    this.notifyService.showWarning(
                      "Something went wrong",
                      "Warning"
                    );
                    this.Searchalert();
                    // this.getAlertListData();
                    // this.ResetValues();
                    this.spinner.hide();
                  }
                },
                (err) => {
                  console.log(err);
                  this.spinner.hide();
                }
              );
          })
          .catch((error) => {
            //console.error(error);
            console.log(error);
            this.ResetValues();
            this.spinner.hide();
          });
      }
    } else {
      this.notifyService.showWarning(
        "Please select at least one record.",
        "Warning"
      );
    }
  }

  public ResetValues() {
    this.selectedAlertid = [];
    this.tempselectedAlertid = [];
    this.form4id = 0;
    this.singleAlertid = 0;
    this.selectAllState = "unchecked";
    this.formidremove = [];
    this.mySelection = [];
    this.selectflag = 0;
  }

  public onAlertType() {
    this.severitylist = [];
    this.selectedseverity = [];
    this.owneroncurrentflag = true;
    this.domainidvalue = [];
    for (var i = 0; i < this.selecteddomain.length; i++) {
      this.domainidvalue.push(this.selecteddomain[i].domainid);
    }
    this.loadIncidentName();
    localStorage.setItem("tmplivedsalertid", "");
  }

  public onDomainChange() {
    this.selectedorgid = [];
    let dbtype = "live";
    this.AlertService.SaveSelectedDomain(
      this.selecteddomain.map((x) => x.domainid),
      dbtype
    );
    this.domainidvalue = [];
    for (var i = 0; i < this.selecteddomain.length; i++) {
      this.domainidvalue.push(this.selecteddomain[i].domainid);
    }
    if (this.selecteddomain.length == this.domainlist.length) {
      this.isAllSelected = true;
    } else {
      this.isAllSelected = false;
    }
    this.loadIncidentName();
    localStorage.setItem("tmplivedsalertid", "");

    this.isAllAlertSelected =
      this.alertnamelist.length == this.selectedalertname.length ? true : false;
  }

  public onIncidentChange() {
    this.incidentids = [];
    for (var i = 0; i < this.selectedalertname.length; i++) {
      this.incidentids.push(this.selectedalertname[i].incidentid);
    }
    if (this.selectedalertname.length == this.alertnamelist.length) {
      this.isAllAlertSelected = true;
    } else {
      this.isAllAlertSelected = false;
    }
  }
  myCurrentDate: any;
  todayDate = new Date(
    this.datepipe.transform(this.alertdashboardbroker.AlertDate, "yyyy-MM-dd")
  );

  public initilizesearchobject() {
    this.spinner.show();
    this.myCurrentDate = new Date(
      this.datepipe.transform(this.alertdashboardbroker.AlertDate, "yyyy-MM-dd")
    );
    let myPastDate = new Date(this.myCurrentDate);

    // if(localStorage.getItem('livedsalertid')!=null)
    // {
    //     this.domainidvalue=[];
    //       this.domainidvalue.push(localStorage.getItem('livedsdomainid'));
    //       this.currentstatusvalue.push(localStorage.getItem('livedscurrentstatus'));
    // }

    if (localStorage.getItem("tmplivedsalertid") != "") {
      this.selectedstatus = [];
      this.selectedstatus.push({ id: 1, statusname: "Open" });
      this.selectedstatus.push({ id: 2, statusname: "In Progress" });
      this.selectedstatus.push({ id: 3, statusname: "Closed" });

      if (localStorage.getItem("aetype") == "1") {
        this.selectedalerttype = { name: "Alerts", Id: 1 };
      } else if (localStorage.getItem("aetype") == "2") {
        this.selectedalerttype = { name: "Events", Id: 2 };
      } else if (localStorage.getItem("aetype") == "3") {
        this.selectedalerttype = { name: "KPI Violations", Id: 3 };
      }
    }
    let objSearchOtherCriteria: SearchOthercriteria = {
      alerttype: this.selectedalerttype.Id,
      boundary: this.selectedorgid,
      currentstatus:
        this.currentstatusvalue && this.currentstatusvalue.length
          ? this.currentstatusvalue
          : this.selectedstatus && this.selectedstatus.length
            ? this.selectedstatus.map((x) => x.statusname)
            : [],
      domainid: this.domainidvalue, //(this.selecteddomain && this.selecteddomain.length) ?  this.selecteddomain.map(x => x.domainid) : [],
      assigneduser: [],
      severity: [],
      incidentids: this.incidentids,
      offset: 0,
      limit: 10,
    };

    this.objAlertDashboardSearch = {
      alertfromdate: myPastDate,
      alerttodate: this.myCurrentDate,
      isAdmin: false,
      userrole: "",
      clientid: 0,
      domainid: 0,
      userid: "",
      searchothercriteria: objSearchOtherCriteria,
      searchaekid: 0,
    };
  }

  isAllSelected: boolean = true;
  isAllAlertSelected: boolean = false;
  isAllUserSelected: boolean = false;

  toggleSelectAll() {
    if (this.isAllSelected) {
      this.selecteddomain = [];
    } else {
      this.selecteddomain = this.domainlist;
    }

    this.isAllSelected = !this.isAllSelected;

    this.onDomainChange();
  }

  toggleSelectAlertAll() {
    if (this.isAllAlertSelected) {
      this.selectedalertname = [];
    } else {
      this.selectedalertname = this.alertnamelist;
    }

    this.isAllAlertSelected = !this.isAllAlertSelected;

    this.onIncidentChange();
  }

  toggleSelectUserAll() {
    if (this.isAllUserSelected) {
      this.selectedowneroncurrent = [];
    } else {
      this.selectedowneroncurrent = this.owneroncurrentlist;
    }
    this.isAllUserSelected = !this.isAllUserSelected;
  }
  loadAllDomain() {
    this.alertdashboardbroker.GetDomainList().subscribe(
      (form: any) => {
        if (form) {
          // if(this.alertdashboardbroker.summarydomainid==undefined)
          // {
          // this.domainlist = form.filter(x => x.status == true);
          // this.selecteddomain = form.filter(x => x.status == true);
          // }
          // else
          // {
          //   this.domainlist = form.filter(x => x.status == true);
          //   this.selecteddomain = form.filter(x => x.domainid == this.alertdashboardbroker.summarydomainid);
          //   this.domainidvalue.push(this.alertdashboardbroker.summarydomainid);
          // }
          // for(let i=0; i<= this.domainlist.length; i++){
          //   this.selecteddomain.push(this.domainlist[i]);
          // }

          if (
            this.alertdashboardbroker == null ||
            this.alertdashboardbroker == undefined
          ) {
            this.domainlist = form.filter((x) => x.status == true);
            this.selecteddomain = form.filter((x) => x.status == true);
          } else {
            if (
              this.alertdashboardbroker.summarydomain == null ||
              this.alertdashboardbroker.summarydomain == undefined
            ) {
              this.domainlist = form.filter((x) => x.status == true);
              // if(localStorage.getItem('tmplivedsalertid')!=""){
              //   this.selecteddomain = form.filter(x => x.domainid == parseInt(localStorage.getItem("livedsdomainid")));
              // }
              // else
              // {
              this.selecteddomain = form.filter((x) => x.status == true);
              //}
            } else {
              this.domainlist = form.filter((x) => x.status == true);
              this.selecteddomain = form.filter(
                (x) =>
                  x.domainid == this.alertdashboardbroker.summarydomain.domainid
              );
            }
          }
          for (var i = 0; i < this.selecteddomain.length; i++) {
            this.domainidvalue.push(this.selecteddomain[i].domainid);
          }
          let dbtype = "live";
          this.AlertService.SaveSelectedDomain(this.domainidvalue, dbtype);
        } else {
          this.notifyService.showWarning(form.message, "Warning");
        }
        this.loadAlertStatus();
        this.loadIncidentName();
      },
      (err) => {
        console.log(err);
      }
    );
  }
  loadIncidentName() {
    this.incidentids = [];
    this.alertdashboardbroker
      .GetIncidentList(this.domainidvalue, this.selectedalerttype.Id)
      .subscribe((data: any) => {
        this.alertnamelist = data;
        this.selectedalertname = this.alertnamelist;
        for (var i = 0; i < this.selectedalertname.length; i++) {
          this.incidentids.push(this.selectedalertname[i].incidentid);
        }
      });
  }
  loadAlertStatus() {
    this.alertdashboardbroker.GetIncidentStatusMaster().subscribe(
      (form: any) => {
        if (form) {
          this.statuslist = form;

          for (let i = 0; i < this.statuslist.length; i++) {
            if (
              this.statuslist[i].statusname == "Open" ||
              this.statuslist[i].statusname == "In Progress"
            ) {
              this.selectedstatus.push(this.statuslist[i]);
            }
          }
          if (this.alertdashboardbroker.summaryalerttype) {
            //this.selectedalerttype.Id = this.alertdashboardbroker.summaryalerttype;
            if (this.alertdashboardbroker.summaryalerttype == 1) {
              this.selectedalerttype = { name: "Alerts", Id: 1 };
            } else if (this.alertdashboardbroker.summaryalerttype == 2) {
              this.selectedalerttype = { name: "Events", Id: 2 };
            } else if (this.alertdashboardbroker.summaryalerttype == 3) {
              this.selectedalerttype = { name: "KPI Violations", Id: 3 };
            }
          }
          // if (this.alertdashboardbroker.summarydomain) {
          //   //this.selecteddomain.push(this.alertdashboardbroker.summarydomain);
          //  this.onDomainChange();
          // }

          this.initilizesearchobject();

          // this.getAlertListData();
        } else {
          this.notifyService.showWarning(form.message, "Warning");
        }
      },
      (err) => {
        console.log(err);
      }
    );
  }

  public convert(str) {
    var date = new Date(str),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
  }
  owneroncurrentflag = true;
  isShow: boolean = false;

  public lockObj = {
    date: new Date().toISOString().slice(0, 10),
    domainIds: [],
    alertTypeIds: [],
    statusIds: [],
    incidentIds: [],
    severity: [],
    userIds: [],
  };

  public getAlertListData(
    limit = this.state.take,
    offset = this.state.skip,
    defaultSearch = false,
    alertId = null,
    showSpinner = true
  ) {
    if (offset == 0 && showSpinner) {
      this.spinner.show();
      limit = this.state.take * 4;
    }

    const data = {
      isDeviceAlert: false,
      userId: this.authenticationService.currentUserValue.idamUserId,
      userRole: this.authenticationService.currentUserValue.userRole,
      requestTime: localStorage.getItem("requestTime"),
      limit: limit,
      offset: offset,
      clientId: this.authenticationService.currentUserValue.clientid,
      fromDate: this.lockObj.date,
      toDate: this.lockObj.date,
      domainIds: this.lockObj.domainIds,
      alertTypeIds: this.lockObj.alertTypeIds,
      statusIds: this.lockObj.statusIds,
      incidentIds: this.lockObj.incidentIds,
      severity: this.lockObj.severity,
      userIds: this.lockObj.userIds,
      orgIds: [],
      isAdmin: this.isAdmin,
      alertId: alertId != null ? [alertId] : null,
    };

    this.alertdashboardbroker.GetDashboardAlertListServiceNew(data).subscribe(
      (form: any) => {
        this.processAlertData(form);
        this.spinner.hide();
      },
      (err) => {
        this.spinner.hide();
      }
    );
  }

  private getNowUTC(variab: any) {
    const now = new Date(variab);
    return new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  }

  public Searchalert(alertId = null, resetPage = false) {
    localStorage.setItem("requestTime", new Date().toISOString());
    if (this.searchDate != this.alertdashboardbroker.AlertDate || resetPage) {
      this.searchDate = this.alertdashboardbroker.AlertDate;
      this.AlertDashboardList = [];
      this.gridData = null;
      this.state.skip = 0;
      this.state.take = 20;
    }
    // this.alertdashboardbroker.AlertDate = new Date();
    // this.searchDate = this.alertdashboardbroker.alertDate;
    this.lockObject();
    this.lockObj.date = this.searchDate.toISOString();
    this.spinner.show();
    this.getAlertListData(undefined, undefined, undefined, alertId);
  }

  public clientheaderpath: any;
  public amnexHeaderpath: any = "";
  loadclientLogo() {
    let clientid =
      this.authenticationService.currentUserValue == null
        ? 0
        : this.authenticationService.currentUserValue.clientid;
    if (clientid > 0) {
      this.clientService.getclientdetails(clientid).subscribe((data) => {
        this.clientheaderpath = data[0].clientlogoapplicationheader;
        this.amnexHeaderpath = "../../../../assets/images/CitySpectNew.png";
        //To convert the Image URL to Base64
        this.getBase64ImageFromUrl("../../../../assets/images/CitySpectNew.png")
          .then((result) => (this.amnexHeaderpath = result))
          .catch((err) => console.error(err));
      });
    } else {
      this.clientheaderpath = "../../../../assets/images/amnex_logo.png";
    }
  }

  // generateExcel() {
  //   let reportname = "Alert List View";
  //   let filename = 'AlertList.xlsx';
  //   let gridshow = this.gridData.data.map(Object.values);
  //   this.excelService.generateExcel(this.fields, gridshow, reportname, filename, this.fromdatevalue, this.todatevalue, this.authenticationService.currentUserValue.userName);
  // }

  public dataStateChange(state: DataStateChangeEvent): void {
    this.state = state;
    this.gridData = process(this.AlertDashboardList, this.state);
    this.gridData.total = this.totalCounts;
    this.gridDataNew = this.gridData.data;
    this.finalGridData = this.AlertDashboardList;
    const pageNumber = this.state.skip / this.state.take + 1;

    if (
      this.AlertDashboardList.length <
      this.state.take + this.state.skip * 2
    ) {
      this.getAlertListData(
        this.state.take * 3,
        this.state.take * (pageNumber + 1)
      );
    }
  }
  menuTop: string;
  menuLeft: string;
  toggleShow(rowIndex, event: MouseEvent) {
    // alert(rowIndex)
    if (this.currentcontexmenu === rowIndex) {
      this.currentcontexmenu = -1;
    } else {
      this.currentcontexmenu = rowIndex;
    }
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.menuTop = rect.bottom + "px";
    this.menuLeft = rect.left + "px";
  }

  clickOutside() {
    this.currentcontexmenu = -1;
  }

  public colorCode(status: string) {
    let colorCode;
    switch (status) {
      case "Open":
        colorCode = "#FF6661";
        break;
      case "In Progress":
        colorCode = "#FFAB00";
        break;
      case "Closed":
      case "Terminated":
      case "Dismissed":
        colorCode = "#36B47F";
        break;
    }

    return colorCode;
  }

  public colorCodepraority(status: string) {
    let colorCode;
    switch (status) {
      case "Medium":
        colorCode = "#feaa00";
        break;
      case "Low":
        colorCode = "#1dae79";
        break;
      case "High":
        //colorCode = '#f9485a';
        colorCode = "#FF6661";
        break;
    }
    return colorCode;
  }

  OpenConfirmation(dataItem) {
    this.currentDataItem = dataItem;
    if (
      this.currentDataItem.alert_flag === "duplicate" &&
      this.currentDataItem.duplicate_ids
    ) {
      this.notifyService
        .showConfirmation(
          "Duplicate Alert Found",
          //`This alert is marked as duplicate of Alert ID: ${this.currentDataItem.duplicate_ids}. Are you sure you want to acknowledge it?`
          `System has identified this as a Duplicate Alert of Alert ID: ${this.currentDataItem.duplicate_ids}. Do you want to acknowledge and proceed with this alert?`,
          "Yes",
          "No"
        )
        .then((res) => {
          this.acknowledgeAlertSuccess();
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      // If not duplicate, show normal confirmation
      this.notifyService
        .showConfirmation(
          "Are you sure?",
          "Do you want to acknowledge this alert?",
          "Yes",
          "No"
        )
        .then((res) => {
          this.acknowledgeAlertSuccess();
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  // OpenConfirmation(dataItem) {
  //   // debugger;
  //   this.currentDataItem = dataItem;

  //   // Check if the alert is a duplicate
  //   if (this.currentDataItem.alert_flag === 'duplicate') {
  //     this.notifyService.showConfirmation(
  //       'Duplicate Alert Found',
  //       'This alert is marked as duplicate. Are you sure you want to acknowledge it?',
  //       'Yes',
  //       'No'
  //     ).then((res) => {
  //       this.notifyService.showConfirmation(
  //         'Are you sure?',
  //         'Do you want to acknowledge this alert?',
  //         'Yes',
  //         'No'
  //       ).then((res) => {
  //         //this.acknowledgeAlertSuccess();
  //       });
  //     }).catch((error) => {
  //       console.log('Duplicate alert acknowledgment cancelled.');
  //     });

  //   } else {
  //     // If not duplicate, show normal confirmation
  //     this.notifyService.showConfirmation(
  //       'Are you sure?',
  //       'Do you want to acknowledge this alert?',
  //       'Yes',
  //       'No'
  //     ).then((res) => {
  //       //this.acknowledgeAlertSuccess();
  //     }).catch((error) => {
  //       console.error(error);
  //     });
  //   }
  // }

  public closeConfirmation() {
    this.currentDataItem = null;
    this.acknowledgeAlertzone = false;
  }

  acknowledgeAlertSuccess() {
    this.alertdashboardbroker
      .PostAlertAcknowledge(
        this.currentDataItem.alertdetailsid,
        this.currentDataItem.alerttype,
        this.currentDataItem.currentescalationlevel
      )
      .subscribe(
        (form: any) => {
          if (form.result) {
            if (form.result && form.result == 1) {
              if (
                form.message == "Access denied to acknowledge at this level."
              ) {
                this.notifyService.showSuccess(form.message, "Warning");
              } else {
                this.notifyService.showSuccess(form.message, "Success");
              }

              // this.Searchalert(this.currentDataItem.alertdetailsid);
            } else {
              this.notifyService.showSuccess(form.message, "Warning");
              // this.Searchalert(this.currentDataItem.alertdetailsid);
            }
          } else {
            this.notifyService.showWarning(form.message, "Warning");
          }
        },
        (err) => {
          console.log(err);
        }
      );
  }

  ActionTaken(boxActionFlag, dataItem) {
    if (boxActionFlag != "") {
      this.currentDataItem = dataItem;

      this.boxActionFlag = boxActionFlag;
    }
    if (boxActionFlag == "boxhandlealert") {
      console.log(dataItem);
      setTimeout(() => {
        this.AlertlocationmapComponent.GetAlertLocationData();
      }, 1500);
    }
  }

  HoursToDdHhMmSs(sptime) {
    //var Days=Math.floor(sptime/24);
    var Days = Math.floor(sptime / 24);
    sptime = sptime % 24;
    var decimalTimeString = sptime;
    var decimalTime = parseFloat(decimalTimeString);
    decimalTime = decimalTime * 60 * 60;
    var hours = Math.floor(decimalTime / (60 * 60));
    decimalTime = decimalTime - hours * 60 * 60;
    var minutes = Math.floor(decimalTime / 60);
    decimalTime = decimalTime - minutes * 60;
    var seconds = Math.round(decimalTime);

    var finhours, finminutes, finseconds;
    finhours = hours;
    finminutes = minutes;
    finseconds = seconds;

    var finTime = "";
    if (Days > 0) {
      finTime =
        Days + "d " + finhours + "h " + finminutes + "m " + finseconds + "s";
    } else {
      finTime = finhours + "h " + finminutes + "m " + finseconds + "s";
    }
    return finTime;
    /** If we have to add leading 0 then
       if(hours < 10) {
         finhours = "0" + hours;
      }
      else{
        finhours = hours;
      }
      if(minutes < 10) {
        finminutes = "0" + minutes;
      }
      else{
        finminutes = minutes;
      }
      if(seconds < 10){
        finseconds = "0" + seconds;
      }
      else{
        finseconds = seconds;
      }
     */
  }

  public selectedorgid: any[] = [];
  public key = "domainid";
  public key2 = "id";
  public objectkey = "assetid";
  public checkedKeys3: any[] = [];
  public showboundry: boolean = false;
  public show: boolean = false;
  public isEventDialogDataAvailable: boolean;
  public selectedDashboard: any = 1;
  public EventToggled = false;
  public headerPaddingCells: any = {
    background: "#ffFF00",
  };

  GetSelectedOrgLevel(orgids: any) {
    if (!orgids.show) {
      if (orgids[orgids.length - 1].domainid != undefined) {
        orgids.splice(orgids.length - 1, 1);
      }
    }

    this.selectedorgid = orgids;
    if (orgids.show) {
      this.showboundry = false;
      this.show = false;
      this.selectedorgid = [];
      return;
    }
  }

  public ResetDropdown() {
    // this.selectedseverity = [];
    // this.selectedowneroncurrent = [];
    localStorage.setItem("tmplivedsalertid", "");
    //this.owneroncurrentflag=true;
  }

  public defaultDate = new Date();
  public severityList: any;
  public clientid: any = this.authenticationservice.currentUserValue.clientid;
  loadSeverity() {
    var requestBody = {
      clientid: this.clientid,
      selecteddate: formatDate(this.defaultDate, "yyyy-MM-dd", "en"),
    };
    this.taskDashboardService.GetSeverity(requestBody).subscribe(
      (data: any) => {
        if (data) {
          this.selectedseverity = [];
          this.severitylist = lodash.uniq(
            data
              .filter((x) => x.severity != "" && x.severity != null)
              .map((x) => x.severity)
          );
          this.selectedseverity = this.severitylist;
        } else {
          this.notifyService.showWarning("Severity not found", "Warning");
        }
      },
      (err) => {
        this.notifyService.showError(err, "Error");
      }
    );
  }

  public onVisibilityChange(e: any): void {
    e.columns.forEach((column) => {
      if (column.hidden == true) {
        this.hiddenFields.push(column.field);
      } else {
        var index = this.hiddenFields.indexOf(column.field);
        if (index > -1) {
          this.hiddenFields.splice(index, 1);
        }
      }
    });
  }

  //code for getting export excel all data
  public allData(): ExcelExportData {
    this.finalGridData.forEach((element) => {
      //element.isacknowledgedoncurrent=(element.isacknowledgedoncurrent)? 'Yes':'No';
      // element.alertdate=this.commonservice.ConverttoLocalTime(element.alertdate);
      // element.alertdate=this.commonservice.FormattingDateTime(element.alertdate);
    });
    const result: ExcelExportData = {
      data: process(this.finalGridData, { group: undefined }).data,
      group: undefined,
    };
    return result;
  }

  ExportAsHTML() {
    const element: HTMLElement = document.querySelector(".mynewdiv");
    const dataURI =
      "data:text/html;base64," + encodeBase64(element.innerHTML.toString());
    saveAs(dataURI, "AlertListView.html");
  }

  public exportElementAsImage(elementId: string) {
    const element: HTMLElement = document.querySelector(".k-grid");
    //const tables = [...element.querySelectorAll('.k-grid-table')];
    const tables = [...element.querySelectorAll(".k-grid-table")];
    tables.forEach((table: HTMLElement) => {
      if (table.style.transform) {
        const translateY = table.style.transform.replace(
          /translateY\((.+)\)/,
          "$1"
        );
        if (translateY) {
          table.style.top = translateY;
          table.style.transform = "";
        }
      }
    });
    drawDOM(element)
      .then((group: Group) => {
        tables.forEach((table: HTMLElement) => {
          if (table.style.top) {
            table.style.transform = "translateY(" + table.style.top + ")";
            table.style.top = "";
          }
        });
        return exportImage(group);
      })
      .then((dataUri) => {
        saveAs(dataUri, ("AlertListView" ?? elementId) + ".png");
      });
  }

  async getBase64ImageFromUrl(imageUrl) {
    var res = await fetch(imageUrl);
    var blob = await res.blob();
    return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.addEventListener(
        "load",
        function () {
          resolve(reader.result);
        },
        false
      );

      reader.onerror = () => {
        return reject(this);
      };
      reader.readAsDataURL(blob);
    });
  }

  public onPageChange(event: PageChangeEvent) {
    // this.state.skip = event.skip;
    // this.state.take = event.take;
    // this.getAlertListData(event.skip,event.take)
  }

  public searchDate = new Date();

  refreshAlertDate() { }

  public fetchAllDataForExcel(): ExcelExportData {
    return {
      data: this.AlertDashboardList,
      group: [],
    };
  }

  private startConnection() {
    this.connection = new signalR.HubConnectionBuilder()
      .configureLogging(signalR.LogLevel.Information)
      .withUrl(environment.signelRUrl + this.channelName, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    Object.defineProperty(WebSocket, 'OPEN', { value: 1, });
    this.connection
      .start()
      .then(() => {
      })
      .catch(err => {
        console.log(err);
      });

    this.connection.on(this.methodName + '_' + this.authenticationService.currentUserValue.clientid, (data: any) => {
      if (data && data.data) {
        this.handleAlertData(data.data);
      }
    });
  }

  private processAlertData(data: any) {
    if (data.result) {
      if (data.totalCounts && data.totalCounts != -1) {
        this.totalCounts = data.totalCounts;
      }

      let records = data.result.dashboardAlertDetails;

      for (let p = 0; p < records.length; p++) {
        records[p].alertdate = this.ecbCallBoxService.systemDateTime(
          records[p].alertdate
        );

        if (
          this.authenticationService.currentUserValue.userRole.toLowerCase() ==
          "clientadminrole"
        ) {
          if (records[p].domainid == 9 && records[p].alerttype == 1) {
            records[p].rightsdetails.isabletoacknowledge = false;
            records[p].isacknowledgedoncurrent == false;
            records[p].rightsdetails.isabletocollaborate = true;
          } else {
            if (
              records[p].isacknowledgedoncurrent == false &&
              records[p].currentstatus == "Open"
            ) {
              records[p].rightsdetails.isabletoacknowledge = true;
            }
            if (
              records[p].isacknowledgedoncurrent == false &&
              records[p].currentstatus == "In Progress"
            ) {
              records[p].rightsdetails.isabletoacknowledge = true;
            }
          }

          //records[p].rightsdetails.isabletoacknowledge = true;
          if (
            records[p].isacknowledgedoncurrent == true &&
            records[p].currentstatus == "In Progress"
          ) {
            records[p].rightsdetails.isabletoacknowledge = false;
            records[p].rightsdetails.isabletoaltersop = true;
            //records[p].rightsdetails.isabletochoosecase = false;
            records[p].rightsdetails.isabletocollaborate = true;
            records[p].rightsdetails.isabletodismiss = true;
            records[p].rightsdetails.isabletodispatch = true;
            records[p].rightsdetails.isabletoeditalert = true;
            records[p].rightsdetails.isabletohandlealert = true;
            records[p].rightsdetails.isabletolinkalert = true;
            records[p].rightsdetails.isabletopriority = true;
            records[p].rightsdetails.isabletosharetransfer = true;
            records[p].rightsdetails.isabletostatus = true;
            records[p].rightsdetails.isabletoterminate = true;
            records[p].rightsdetails.iscurrentroluser = true;
            records[p].rightsdetails.isowner = true;
          }
        }
        records[p].totaldurationspent = this.HoursToDdHhMmSs(
          records[p].totaldurationspent
        );
      }

      this.AlertDashboardList.push(...records);
      this.AlertDashboardList = Array.from(
        new Map(
          this.AlertDashboardList.concat(records).map(
            (item: any): [number, any] => [item.alertdetailsid, item]
          )
        ).values()
      );

      this.gridData = process(
        this.AlertDashboardList.sort(
          (a, b) => b.alertdetailsid - a.alertdetailsid
        ),
        this.state
      );
      this.gridData.total = this.totalCounts;

      this.gridDataNew = this.AlertDashboardmapList;
      this.finalGridData = this.AlertDashboardmapList;
      this.spinner.hide();

      this.isAllAlertSelected =
        this.alertnamelist.length == this.selectedalertname.length
          ? true
          : false;
    }
  }

  private getFilterData() {
    this.alertdashboardbroker.getAlertListViewFilterData().subscribe(
      (res: any) => {
        if (res) {
          this.domainlist = res.domainList.map((item) => ({
            domainid: item.id,
            name: item.name,
          }));
          this.alerttypelist = res.alertTypeList.map((item) => ({
            Id: item.id,
            name: item.name,
          }));
          this.statuslist = res.alertStatusList.map((item) => ({
            id: item.id,
            statusname: item.name,
          }));
          this.alertnamelist = res.incidentList.map((item) => ({
            incidentid: item.id,
            name: item.name,
          }));
          this.severitylist = res.severityList;
          this.owneroncurrentlist = res.userList.map((item) => ({
            id: item.id,
            ownername: item.name,
          }));

          //default selection
          this.selecteddomain =
            this.lockObj.domainIds.length > 0
              ? this.domainlist.filter((x: any) =>
                this.lockObj.domainIds.includes(x.domainid)
              )
              : this.domainlist;
          this.selectedalerttype = this.alerttypelist[0];
          this.selectedstatus = this.statuslist;
          this.selectedalertname = this.alertnamelist;
          this.selectedseverity = this.severitylist;
          this.selectedowneroncurrent = this.owneroncurrentlist;

          this.isAllUserSelected =
            this.owneroncurrentlist.length == this.selectedowneroncurrent.length
              ? true
              : false;
          this.isAllAlertSelected =
            this.alertnamelist.length == this.selectedalertname.length
              ? true
              : false;

          this.onDomainChange();
          this.lockObject();
        }
      },
      (err: any) => { }
    );
  }

  private lockObject() {
    this.lockObj.date = this.searchDate.toISOString();
    this.lockObj.domainIds = this.selecteddomain.map((x: any) => x.domainid);
    this.lockObj.alertTypeIds = [this.selectedalerttype.Id];
    this.lockObj.statusIds = this.selectedstatus.map((x: any) => x.id);
    this.lockObj.incidentIds = this.selectedalertname.map(
      (x: any) => x.incidentid
    );
    this.lockObj.severity = this.selectedseverity;
    this.lockObj.userIds = this.selectedowneroncurrent.map((x: any) => x.id);
  }

  exportFile(file: string) {
    if (this.AlertDashboardList.length < this.totalCounts) {
      const data = {
        isDeviceAlert: false,
        userId: this.authenticationService.currentUserValue.idamUserId,
        userRole: this.authenticationService.currentUserValue.userRole,
        requestTime: localStorage.getItem("requestTime"),
        limit: this.totalCounts,
        offset: 0,
        clientId: this.authenticationService.currentUserValue.clientid,
        fromDate: this.lockObj.date,
        toDate: this.lockObj.date,
        domainIds: this.lockObj.domainIds,
        alertTypeIds: this.lockObj.alertTypeIds,
        statusIds: this.lockObj.statusIds,
        incidentIds: this.lockObj.incidentIds,
        severity: this.lockObj.severity,
        userIds: this.lockObj.userIds,
        orgIds: [],
        isAdmin: this.isAdmin,
        alertId: null,
      };

      this.spinner.show();
      this.alertdashboardbroker.GetDashboardAlertListServiceNew(data).subscribe(
        (data: any) => {
          this.processAlertData(data);
          setTimeout(() => {
            if (this.grid) {
              this.gridData.data = this.AlertDashboardList;
              if (file == "excel") {
                this.grid.saveAsExcel();
              }
              if (file == "pdf") {
                this.grid.saveAsPDF();
              }
              this.gridData = process(
                this.AlertDashboardList.sort(
                  (a, b) => b.alertdetailsid - a.alertdetailsid
                ),
                this.state
              );
            } else {
              this.notifyService.showError("Unable to Export File.", "Error");
            }
            this.spinner.hide();
          }, 10);
        },
        (err: any) => {
          this.spinner.hide();
        }
      );
    } else {
      this.gridData.data = this.AlertDashboardList;
      if (file == "excel") {
        this.grid.saveAsExcel();
      }
      if (file == "pdf") {
        this.grid.saveAsPDF();
      }
      this.gridData = process(
        this.AlertDashboardList.sort(
          (a, b) => b.alertdetailsid - a.alertdetailsid
        ),
        this.state
      );
    }
  }

  public rightsObj = {
    "isowner": false,
    "iscurrentroluser": false,
    "isabletoacknowledge": false,
    "isabletochoosecase": false,
    "isabletoeditalert": false,
    "isabletolinkalert": false,
    "isabletosharetransfer": false,
    "isabletopriority": false,
    "isabletostatus": false,
    "isabletoaltersop": false,
    "isabletoterminate": false,
    "isabletodispatch": false,
    "isabletohandlealert": false,
    "isabletocollaborate": false,
    "isabletodismiss": false
  };

  handleAlertData(data: any) {

    let isMatch = (
      !this.lockObj.date || data.alertdate.slice(0, 10) === this.lockObj.date.slice(0, 10)
    ) &&
      (
        this.lockObj.domainIds.length === 0 || this.lockObj.domainIds.includes(data.domainid)
      ) &&
      (
        this.lockObj.alertTypeIds.length === 0 || this.lockObj.alertTypeIds.includes(data.alerttype)
      ) &&
      (
        this.lockObj.statusIds.length === 0 || this.lockObj.statusIds.includes(data.currentstatusid)
      ) &&
      (
        this.lockObj.incidentIds.length === 0 || this.lockObj.incidentIds.includes(data.incidenttypeid)
      ) &&
      (
        this.lockObj.severity.length === 0 || this.lockObj.severity.includes(data.severity)
      ) &&
      (
        this.lockObj.userIds.length === 0 || this.lockObj.userIds.includes(data.currentownerid) || data.assigneduserid.split(',').some(id => this.lockObj.userIds.includes(id))
      );

    if (isMatch) {

      data.alertdate = this.ecbCallBoxService.systemDateTime(data.alertdate);

      const assignedUsers = data.assigneduserid.split(",");
      let rights = { ...this.rightsObj };

      if (data.currentownerid == this.authenticationService.currentUserValue.idamUserId) {
        rights.isowner = true;
      }

      if (data.currentstatus == "Open" && assignedUsers.includes(this.authenticationService.currentUserValue.idamUserId)) {
        rights.isabletoacknowledge = true;
      } else if (data.currentstatus == "In Progress" && rights.isowner) {
        // data.currentstatus == "Open" || 
        rights.isabletoacknowledge = true;
        rights.isabletoeditalert = (data.alerttype == 1) ? true : false;
        rights.isabletostatus = true;
        rights.isabletodismiss = true;
        rights.isabletoterminate = true;
        rights.isabletoaltersop = true;
        rights.isabletodispatch = true;
        rights.isabletohandlealert = true;
        rights.isabletopriority = true;
        rights.isabletosharetransfer = true;
      }

      if (this.authenticationService.currentUserValue.userRole == "ClientAdminRole") {
        rights.isowner = true;
        if (data.currentstatus == "Open") {
          rights.isabletoacknowledge = true;
        } else if (data.currentstatus == "In Progress") {
          rights.iscurrentroluser = true;
          rights.isabletoacknowledge = true;
          rights.isabletoeditalert = true;
          rights.isabletolinkalert = true;
          rights.isabletosharetransfer = true;
          rights.isabletopriority = true;
          rights.isabletostatus = true;
          rights.isabletoaltersop = true;
          rights.isabletoterminate = true;
          rights.isabletodispatch = true;
          rights.isabletohandlealert = true;
          rights.isabletocollaborate = true;
          rights.isabletodismiss = true;
        } else if (data.currentstatus == "Closed") { 

        }
      
    }

    data["rightsdetails"] = rights;

    data.totaldurationspent = this.HoursToDdHhMmSs(
      data.totaldurationspent
    );

    const index = this.AlertDashboardList.findIndex(
      (item: any) => item.alertdetailsid === data.alertdetailsid
    );
    if (index !== -1) {
      this.AlertDashboardList[index] = data;
    } else {
      if (!this.isRedirected) {
        this.AlertDashboardList.push(data);
        this.AlertDashboardList.sort((a, b) => b.alertdetailsid - a.alertdetailsid);
        this.totalCounts = this.totalCounts + 1;
      }
    }

    this.gridData = process(this.AlertDashboardList, this.state);
    this.gridData.total = this.totalCounts;
  }

  // this.AlertDashboardList = this.AlertDashboardList.filter(data =>
  //   (
  //     this.lockObj.date || data.alertdate.slice(0, 10) === this.lockObj.date.slice(0, 10)
  //   ) &&
  //   (
  //     this.lockObj.domainIds.length === 0 || this.lockObj.domainIds.includes(data.domainid)
  //   ) &&
  //   (
  //     this.lockObj.alertTypeIds.length === 0 || this.lockObj.alertTypeIds.includes(data.alerttype)
  //   ) &&
  //   (
  //     this.lockObj.statusIds.length === 0 || this.lockObj.statusIds.includes(data.currentstatusid)
  //   ) &&
  //   (
  //     this.lockObj.incidentIds.length === 0 || this.lockObj.incidentIds.includes(data.incidenttypeid)
  //   ) &&
  //   (
  //     this.lockObj.severity.length === 0 || this.lockObj.severity.includes(data.severity)
  //   ) &&
  //   (
  //     this.lockObj.userIds.length === 0 || this.lockObj.userIds.includes(data.currentownerid) || data.assigneduserid.split(',').some(id => this.lockObj.userIds.includes(id))
  //   )
  // );

}
}
