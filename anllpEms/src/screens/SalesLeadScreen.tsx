/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Table, Row } from 'react-native-table-component';
import COLORS from '../constants/colors';
import { AuthContext } from '../store/auth-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Add Sales Lead'>;



type RootStackParamList = {
    'Add Sales Lead': { rowData: SalesLeadData };
};

interface SalesLeadData {
    firmname: string;
    groweraddress: string;
    growerreference: string;
    leadtype: string;
    growercell: string;
    areakanal: string;
    areamarla: string;
    sitelocation: string;
    latitude: string;
    longitude: string;
}

interface Pagination {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

const SalesLeadScreen: React.FC = () => {
    const [salesLeads, setSalesLeads] = useState<SalesLeadData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 15,
        totalCount: 0,
        totalPages: 0,
    });

    const navigation = useNavigation<NavigationProp>();
    const authCtx = useContext(AuthContext);

    const fetchSalesLeads = async (page: number) => {
        try {
            if (page === 1) { setIsLoading(true); }
            else { setIsFetchingMore(true); }
            const response = await fetch(`${authCtx.apiUrl}/saleslead/get/?page=${page}&limit=${pagination.limit}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authCtx.token}`,
                },
            });

            if (!response.ok) {
                const result = await response.json();
                Alert.alert(result.message || 'Failed to fetch sales leads.');
                return;
            }

            const result = await response.json();
            if (page === 1) {
                setSalesLeads(result.data);
            } else {
                setSalesLeads((prev) => [...prev, ...result.data]);
            }
            setPagination(result.pagination);
        } catch (error: any) {
            Alert.alert(error.message || 'An error occurred while fetching sales leads.');
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    };

    const isFocused = useIsFocused();

    useEffect(() => {
        fetchSalesLeads(1);
    }, [authCtx.apiUrl, authCtx.token, isFocused]);

    const tableHead = [
        'Firm Name',
        'Grower Address',
        'Reference',
        'Lead Type',
        'Phone',
        'Site Location',
        'Action',
    ];

    const tableData = salesLeads.map((lead) => [
        lead.firmname,
        lead.groweraddress,
        lead.growerreference,
        lead.leadtype,
        lead.growercell,
        lead.sitelocation,
    ]);

    const handleActionPress = (rowData: SalesLeadData) => {
        navigation.navigate('Add Sales Lead', { rowData });
    };

    const handleLoadMore = () => {
        if (pagination.page < pagination.totalPages && !isFetchingMore) {
            fetchSalesLeads(pagination.page + 1);
            setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
        }
    };


    return (
        <View style={styles.container}>
            {/* <Text style={styles.title}>Sales Leads</Text> */}

            {isLoading ? (
                <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
            ) : (
                <View style={styles.tableContainer}>
                    <ScrollView horizontal>
                        <View>
                            {/* Sticky Header */}
                            <View style={styles.stickyHeaderContainer}>
                                <Table borderStyle={{ borderWidth: 2, borderColor: COLORS.DARK_GRAY }}>
                                    <Row
                                        data={tableHead}
                                        style={styles.header}
                                        textStyle={styles.headerText}
                                        widthArr={Array(tableHead.length).fill(150)}
                                    />
                                </Table>
                            </View>

                            {/* Scrollable Content */}
                            <ScrollView
                                style={styles.dataContainer}
                                onScroll={({ nativeEvent }) => {
                                    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                                    const isBottom =
                                        layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                                    if (isBottom) {
                                        handleLoadMore();
                                    }
                                }}
                                scrollEventThrottle={16}
                            >
                                {tableData.length > 0 ? (
                                    tableData.map((rowData, rowIndex) => (
                                        <View key={rowIndex} style={styles.row}>
                                            {rowData.map((value, cellIndex) => (
                                                <View key={cellIndex} style={[styles.cell, { width: 150 }]}>
                                                    <Text style={styles.rowText}>{value ?? 'N/A'}</Text>
                                                </View>
                                            ))}
                                            <View style={[styles.cell, { width: 150 }]}>
                                                <TouchableOpacity
                                                    style={[styles.button, { backgroundColor: COLORS.ACCENT_ORANGE }]}
                                                    onPress={() => handleActionPress(salesLeads[rowIndex])}
                                                >
                                                    <Text style={styles.buttonText}>Edit</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.placeholderText}>
                                        🚀 No sales data available yet. Please add some sales leads to get started.
                                    </Text>
                                )}
                                {isFetchingMore && (
                                    <ActivityIndicator size="small" color={COLORS.ACCENT_ORANGE} />
                                )}
                            </ScrollView>
                        </View>
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

export default SalesLeadScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
    },
    tableContainer: {
        flex: 1,
    },
    stickyHeaderContainer: {
        zIndex: 1,
        backgroundColor: 'white',
    },
    dataContainer: {
        flex: 1,
    },
    placeholderText: {
        fontSize: 14,
        color: COLORS.DARK_GRAY,
        marginTop: 50,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
        borderRadius: 5,
        width: 100,
    },
    buttonText: {
        color: 'white',
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: COLORS.DARK_GRAY,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.DARK_GRAY,
        marginBottom: 16,
    },
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 5,
        borderRightWidth: 1,
        borderLeftWidth: 1,
        borderColor: COLORS.DARK_GRAY,
    },
    header: {
        height: 40,
        backgroundColor: COLORS.ACCENT_ORANGE,
    },
    headerText: {
        padding: 6,
        width: 150,
        textAlign: 'center',
        color: 'white',
        fontWeight: 'bold',
    },
    rowText: {
        textAlign: 'center',
        fontSize: 12,
        color: COLORS.DARK_GRAY,
        paddingVertical: 6,
        width: 100,
    },
});
